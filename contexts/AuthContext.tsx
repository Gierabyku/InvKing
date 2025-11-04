import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { OrgUser } from '../types';

interface AuthContextType {
    currentUser: User | null;
    orgUser: OrgUser | null; // The user profile from Firestore
    organizationId: string | null;
    loading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    orgUser: null,
    organizationId: null,
    loading: true,
    logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [orgUser, setOrgUser] = useState<OrgUser | null>(null);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data() as Omit<OrgUser, 'docId' | 'email'>;
                    const userProfile: OrgUser = {
                        docId: user.uid,
                        email: user.email!,
                        ...userData,
                    };
                    setOrgUser(userProfile);
                    setOrganizationId(userData.organizationId);
                } else {
                    console.error("User document not found in Firestore! Permissions will be unavailable.");
                    setOrgUser(null);
                    setOrganizationId(null);
                    // Optional: logout user if their profile is missing
                    // signOut(auth);
                }
            } else {
                setOrgUser(null);
                setOrganizationId(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = () => {
        signOut(auth);
    };

    const value = {
        currentUser,
        orgUser,
        organizationId,
        loading,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};