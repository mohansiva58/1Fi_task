"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from "firebase/auth"
import { auth } from "@/lib/firebase-config"

interface User {
  uid: string
  email: string | null
  displayName?: string | null
  photoURL?: string | null
  phoneNumber?: string | null
}

interface AuthStore {
  user: User | null
  loading: boolean
  showLoginModal: boolean
  setShowLoginModal: (show: boolean) => void
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string, name?: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  initAuth: () => void
}

const convertFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  phoneNumber: firebaseUser.phoneNumber,
})

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      showLoginModal: false,

      setShowLoginModal: (show) => set({ showLoginModal: show }),

      initAuth: () => {
        onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            set({ user: convertFirebaseUser(firebaseUser), loading: false })
          } else {
            set({ user: null, loading: false })
          }
        })
      },

      loginWithEmail: async (email, password) => {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password)
          set({ user: convertFirebaseUser(userCredential.user), showLoginModal: false })
        } catch (error: any) {
          throw new Error(error.message || "Login failed")
        }
      },

      registerWithEmail: async (email, password, name) => {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password)
          
          if (name && userCredential.user) {
            await updateProfile(userCredential.user, { displayName: name })
          }
          
          set({ user: convertFirebaseUser(userCredential.user), showLoginModal: false })
        } catch (error: any) {
          throw new Error(error.message || "Registration failed")
        }
      },

      loginWithGoogle: async () => {
        const provider = new GoogleAuthProvider()
        const userCredential = await signInWithPopup(auth, provider)
        set({ user: convertFirebaseUser(userCredential.user), showLoginModal: false })
      },

      logout: async () => {
        try {
          await signOut(auth)
          set({ user: null })
          
          // Clear cart and wishlist from localStorage on logout
          localStorage.removeItem("cart-storage")
          localStorage.removeItem("wishlist-storage")
          
          // Dispatch storage event to notify other components
          window.dispatchEvent(new Event("storage"))
        } catch (error: any) {
          throw new Error(error.message || "Logout failed")
        }
      },

    }),
    { 
      name: "auth-storage",
      partialize: (state) => ({ user: state.user })
    },
  ),
)
