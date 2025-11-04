import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { OrgUser, UserPermissions } from '../types';

interface AuthContextType {
    currentUser: User | null;
    orgUser: OrgUser | null;
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
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as Omit<OrgUser, 'docId' | 'email'>;
                        
                        // Check if permissions object exists, if not, user has no rights.
                        if (!userData.permissions) {
                             console.error("User profile is missing the 'permissions' object. Access will be restricted.");
                             // Set a default restricted profile
                             const restrictedProfile: OrgUser = {
                                docId: user.uid,
                                email: user.email!,
                                organizationId: userData.organizationId,
                                permissions: {
                                    canScan: false, canViewServiceList: false, canViewClients: false,
                                    canViewScheduledServices: false, canViewHistory: false, canViewSettings: false, canManageUsers: false
                                }
                             };
                             setOrgUser(restrictedProfile);
                             setOrganizationId(userData.organizationId);
                        } else {
                            const userProfile: OrgUser = {
                                docId: user.uid,
                                email: user.email!,
                                ...userData,
                            };
                            
                            // Special override for the main test user to ensure they are always an admin.
                            // This helps with initial setup and testing if permissions are misconfigured in Firestore.
                            if (userProfile.email === 'test@firma.pl') {
                                userProfile.permissions.canManageUsers = true;
                            }

                            setOrgUser(userProfile);
                            setOrganizationId(userData.organizationId);
                        }

                    } else {
                        console.error("User document not found in Firestore! Permissions will be unavailable. Logging out.");
                        setOrgUser(null);
                        setOrganizationId(null);
                        signOut(auth); // Log out user if their profile is critically misconfigured
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    signOut(auth); // Log out on error
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