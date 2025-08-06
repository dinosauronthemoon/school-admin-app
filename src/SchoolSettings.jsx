import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Firebase Configuration ---
// Using the configuration for your specific Firebase project.
const firebaseConfig = {
  apiKey: "AIzaSyCWtIZ3NG38rbhmckogJgDczxr7PliW7V0",
  authDomain: "school-admin-c32b3.firebaseapp.com",
  projectId: "school-admin-c32b3",
  storageBucket: "school-admin-c32b3.appspot.com",
  messagingSenderId: "70096697275",
  appId: "1:70096697275:web:3740d98c089d02fb17b69e",
  measurementId: "G-DLQL2J84FS"
};


// --- App and Service Initialization ---
// IMPORTANT: For this to work, you must update your Firestore security rules.
// Go to your Firebase project -> Firestore Database -> Rules and paste the following:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // This rule allows a logged-in user to read and write only their own documents
    // within the specified path. This is crucial for data privacy.
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// --- Helper Icons ---
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-yellow-500"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0 2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

// --- Main Settings Component ---
function SchoolSettings() {
    const [settings, setSettings] = useState({
        schoolName: '',
        schoolEmail: '',
        schoolPhone: '',
        schoolAddress: '',
        academicYear: '',
        schoolLogo: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // --- Authentication and Data Fetching ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                fetchSettings(user.uid);
            } else {
                try {
                    const userCredential = await signInAnonymously(auth);
                    setUserId(userCredential.user.uid);
                    fetchSettings(userCredential.user.uid);
                } catch (e) {
                    console.error("Anonymous sign-in failed:", e);
                    setError("Authentication failed. Please check your Firebase setup and security rules.");
                    setLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchSettings = async (uid) => {
        if (!uid) return;
        setLoading(true);
        setError(null);
        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const docRef = doc(db, `artifacts/${appId}/users/${uid}/schoolSettings/main`);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setSettings(docSnap.data());
            } else {
                console.log("No settings document found, using default values.");
                setSettings({
                    schoolName: 'My Awesome School',
                    schoolEmail: 'contact@awesomeschool.com',
                    schoolPhone: '123-456-7890',
                    schoolAddress: '123 Education Lane, Knowledge City',
                    academicYear: '2024-2025',
                    schoolLogo: '',
                });
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
            setError("Failed to load settings. Check console and ensure Firestore rules are correct.");
        } finally {
            setLoading(false);
        }
    };

    // --- Event Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you would upload this file to a storage service (like Firebase Storage)
            // and save the URL in the 'schoolLogo' field.
            setSettings(prev => ({ ...prev, schoolLogo: `logo-placeholder.png` }));
            showNotification('Logo selected. Press "Save" to apply changes.', 'info');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            setError("You must be logged in to save settings.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const docRef = doc(db, `artifacts/${appId}/users/${userId}/schoolSettings/main`);
            await setDoc(docRef, settings);
            showNotification('Settings saved successfully!', 'success');
        } catch (err) {
            console.error("Error saving settings:", err);
            setError("Failed to save settings. Please check your Firestore rules and try again.");
            showNotification('Failed to save settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification({ message: '', type: '' });
        }, 3000);
    };

    // --- Render Logic ---
    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><div className="text-lg">Loading Settings...</div></div>;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
            {notification.message && (
                <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            <div className="flex flex-col md:flex-row">
                <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-6 shadow-md md:min-h-screen">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Admin Panel</h1>
                    <nav className="space-y-4">
                        <a href="#" className="flex items-center p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Dashboard</a>
                        <a href="#" className="flex items-center p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Students</a>
                        <a href="#" className="flex items-center p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Teachers</a>
                        <a href="#" className="flex items-center p-2 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold">
                            <SettingsIcon />
                            <span className="ml-3">Settings</span>
                        </a>
                    </nav>
                </aside>

                <main className="flex-1 p-6 md:p-10">
                    <header className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h2>
                        <div className="flex items-center space-x-4">
                            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <SunIcon />
                            </button>
                            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <BellIcon />
                            </button>
                            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <UserIcon />
                            </div>
                        </div>
                    </header>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Name</label>
                                    <input type="text" name="schoolName" id="schoolName" value={settings.schoolName} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white" />
                                </div>
                                <div className="col-span-1">
                                    <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Academic Year</label>
                                    <input type="text" name="academicYear" id="academicYear" value={settings.academicYear} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white" placeholder="e.g., 2024-2025"/>
                                </div>
                                <div className="col-span-1">
                                    <label htmlFor="schoolEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Email</label>
                                    <input type="email" name="schoolEmail" id="schoolEmail" value={settings.schoolEmail} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white" />
                                </div>
                                <div className="col-span-1">
                                    <label htmlFor="schoolPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Phone</label>
                                    <input type="tel" name="schoolPhone" id="schoolPhone" value={settings.schoolPhone} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white" />
                                </div>
                                <div className="col-span-2">
                                    <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Address</label>
                                    <textarea name="schoolAddress" id="schoolAddress" rows="3" value={settings.schoolAddress} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"></textarea>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Logo</label>
                                    <div className="mt-1 flex items-center">
                                        <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                            <svg className="h-full w-full text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </span>
                                        <label htmlFor="file-upload" className="ml-5 bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                                            <span>Change</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {error && <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}

                            <div className="mt-8 flex justify-end space-x-4">
                                <button type="button" className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                                <button type="submit" disabled={saving || !!error} className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default SchoolSettings;
