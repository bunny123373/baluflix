// Profile Management JavaScript
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { ref, onValue, update, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const API_BASE = 'http://localhost:5000/api';

// DOM Elements
const profileName = document.querySelector('.profile-name'); // In header dropdown
const profileEmail = document.querySelector('.profile-email'); // May not exist in this page
const profileAvatar = document.querySelector('.profile-avatar img'); // In header
const profileLevel = document.getElementById('profileLevel'); // Read-only field
const displayNameInput = document.getElementById('displayName'); // Form input
const saveProfileBtn = document.querySelector('.save-btn'); // Form submit button
const upgradeModal = document.getElementById('upgrade-modal');
const closeUpgradeModal = document.getElementById('close-upgrade-modal');
const cancelUpgrade = document.getElementById('cancel-upgrade');
const confirmUpgrade = document.getElementById('confirm-upgrade');
const upgradeSummary = document.getElementById('upgrade-summary');
const upgradeBenefits = document.getElementById('upgrade-benefits');

// Photo upload elements
const photoInput = document.getElementById('photo-input');
const uploadBtn = document.getElementById('upload-btn');
const removeBtn = document.getElementById('remove-btn');
const profilePhoto = document.getElementById('profile-photo');
const displayName = document.getElementById('displayName');
const email = document.getElementById('email');
const profileLevelDisplay = document.getElementById('profileLevel');
const subscriptionEndDate = document.getElementById('subscriptionEndDate');
const profileForm = document.getElementById('profile-form');

// Loading and UI elements
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = `
    <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
    </div>
`;

document.body.appendChild(loadingOverlay);

// Current user data
let currentUser = null;
let currentPlan = 'basic';

// Plan pricing
const planPricing = {
    premium: { monthly: 9.99, benefits: ['Watch on 2 devices', 'HD quality', 'Unlimited movies', 'Priority support'] },
    vip: { monthly: 19.99, benefits: ['Watch on unlimited devices', '4K quality', 'Early access to new movies', 'Exclusive content', '24/7 VIP support'] }
};

// Initialize profile page
async function initProfile() {
    try {
        showLoading('Loading your profile...');

        // Get current user from Firebase (assuming user is logged in)
        const user = await getCurrentUser();
        if (!user) {
            hideLoading();
            window.location.href = 'login.html';
            return;
        }

        currentUser = user;
        await loadProfile();
        setupEventListeners();

        // Add fade-in animation to content
        document.querySelector('.profile-container').classList.add('fade-in');

        hideLoading();
    } catch (error) {
        console.error('Error initializing profile:', error);
        hideLoading();
        showError('Failed to load profile. Please try again.');
    }
}

// Get current user from Firebase
async function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Unsubscribe after getting the user
            if (user) {
                resolve({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL
                });
            } else {
                resolve(null);
            }
        }, reject);
    });
}

// Load user profile with real-time updates
async function loadProfile() {
    try {
        // Use demo userId for now - replace with auth.currentUser.uid later
        const userId = 'demoUserId'; // TODO: Replace with auth.currentUser.uid

        const userRef = ref(db, `users/${userId}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                displayProfile(userData);
            } else {
                // User doesn't exist in database yet, create basic profile
                createBasicProfile();
            }
        });
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile data.');
    }
}

// Create basic profile for new users
async function createBasicProfile() {
    try {
        const userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            profileLevel: 'basic'
        };

        // For now, just display basic profile
        displayProfile(userData);
    } catch (error) {
        console.error('Error creating profile:', error);
    }
}

// Display profile data
function displayProfile(user) {
    // Update header elements (if they exist)
    if (profileName) profileName.textContent = user.name || 'User';
    if (profileEmail) profileEmail.textContent = user.email || 'user@example.com';
    if (displayNameInput) displayNameInput.value = user.name || '';

    // Update profile page elements
    if (displayName) displayName.value = user.name || '';
    if (email) email.value = user.email || 'user@example.com';
    if (profileLevelDisplay) profileLevelDisplay.value = user.profileLevel || 'basic';
    if (subscriptionEndDate) subscriptionEndDate.value = user.subscriptionEndDate || 'N/A';

    // Update profile info display elements
    const profileDisplayName = document.getElementById('profile-display-name');
    const profileEmailDisplay = document.getElementById('profile-email-display');
    if (profileDisplayName) profileDisplayName.textContent = user.name || 'User';
    if (profileEmailDisplay) profileEmailDisplay.textContent = user.email || 'user@example.com';

    // Update profile level
    currentPlan = user.profileLevel || 'basic';
    updateProfileLevelDisplay(user);

    // Update avatar
    if (user.photoURL) {
        const fullPhotoURL = user.photoURL.startsWith('http') ? user.photoURL : `http://localhost:5000${user.photoURL}`;
        if (profileAvatar) profileAvatar.src = fullPhotoURL;
        if (profilePhoto) profilePhoto.src = fullPhotoURL;
    } else {
        const defaultPhoto = 'https://via.placeholder.com/150x150/333/fff?text=Profile';
        if (profileAvatar) profileAvatar.src = defaultPhoto;
        if (profilePhoto) profilePhoto.src = defaultPhoto;
    }
}

// Update profile level display
function updateProfileLevelDisplay(user) {
    const levelBadge = profileLevel.querySelector('.level-badge');
    levelBadge.textContent = user.profileLevel.charAt(0).toUpperCase() + user.profileLevel.slice(1);
    levelBadge.className = `level-badge ${user.profileLevel}`;

    // Update plan cards
    updatePlanCards(user.profileLevel);
}

// Update plan cards based on current level
function updatePlanCards(currentLevel) {
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        card.classList.remove('active');
        if (card.classList.contains(currentLevel)) {
            card.classList.add('active');
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Save profile changes
    saveProfileBtn.addEventListener('click', saveProfile);

    // Photo upload event listeners
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => photoInput.click());
    }
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoUpload);
    }
    if (removeBtn) {
        removeBtn.addEventListener('click', removePhoto);
    }

    // Profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfileForm);
    }

    // Upgrade buttons
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const plan = e.target.dataset.plan;
            const duration = parseInt(e.target.dataset.duration);
            showUpgradeModal(plan, duration);
        });
    });

    // Modal controls
    closeUpgradeModal.addEventListener('click', hideUpgradeModal);
    cancelUpgrade.addEventListener('click', hideUpgradeModal);
    confirmUpgrade.addEventListener('click', confirmUpgradeHandler);

    // Close modal when clicking outside
    upgradeModal.addEventListener('click', (e) => {
        if (e.target === upgradeModal) {
            hideUpgradeModal();
        }
    });
}

// Save profile changes
async function saveProfile() {
    try {
        // Clear any existing form errors
        clearFormErrors();

        // Validate input
        const displayName = displayNameInput.value.trim();
        if (!displayName) {
            showFormError(displayNameInput, 'Display name cannot be empty.');
            return;
        }

        if (displayName.length < 2) {
            showFormError(displayNameInput, 'Display name must be at least 2 characters long.');
            return;
        }

        if (displayName.length > 50) {
            showFormError(displayNameInput, 'Display name cannot exceed 50 characters.');
            return;
        }

        // Show loading state
        setButtonLoading(saveProfileBtn, true);

        // Use demo userId for now - replace with auth.currentUser.uid later
        const userId = 'demoUserId'; // TODO: Replace with auth.currentUser.uid

        const userRef = ref(db, `users/${userId}`);
        await update(userRef, { name: displayName });

        // Add success animation to the profile section
        const profileSection = document.querySelector('.profile-info');
        profileSection.classList.add('success-animation');
        setTimeout(() => profileSection.classList.remove('success-animation'), 600);

        showSuccess('Profile updated successfully!');
    } catch (error) {
        console.error('Error saving profile:', error);
        showError(error.message || 'Failed to save profile changes. Please try again.');
    } finally {
        // Hide loading state
        setButtonLoading(saveProfileBtn, false);
    }
}

// Show upgrade modal
function showUpgradeModal(plan, duration) {
    const planInfo = planPricing[plan];
    const totalCost = (planInfo.monthly * duration).toFixed(2);

    // Update modal content
    document.getElementById('upgrade-plan-name').textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
    document.getElementById('upgrade-duration').textContent = duration;
    document.getElementById('upgrade-cost').textContent = `$${totalCost}`;

    // Update benefits
    upgradeBenefits.innerHTML = '<h4>What you\'ll get:</h4><ul>' +
        planInfo.benefits.map(benefit => `<li>${benefit}</li>`).join('') +
        '</ul>';

    // Store upgrade details
    confirmUpgrade.dataset.plan = plan;
    confirmUpgrade.dataset.duration = duration;

    upgradeModal.style.display = 'block';
}

// Hide upgrade modal
function hideUpgradeModal() {
    upgradeModal.style.display = 'none';
}

// Confirm upgrade handler
async function confirmUpgradeHandler() {
    const plan = confirmUpgrade.dataset.plan;
    const duration = parseInt(confirmUpgrade.dataset.duration);

    try {
        // Show loading state
        setButtonLoading(confirmUpgrade, true);
        cancelUpgrade.disabled = true;

        const response = await fetch(`${API_BASE}/user/upgrade/${currentUser.uid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newLevel: plan, duration })
        });

        if (response.ok) {
            const result = await response.json();
            showSuccess(`Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`);
            hideUpgradeModal();

            // Show loading while reloading profile
            showLoading('Updating your profile...');
            await loadProfile();
            hideLoading();

            // Add success animation to the plan cards
            const planCards = document.querySelectorAll('.plan-card');
            planCards.forEach(card => {
                if (card.classList.contains(plan)) {
                    card.classList.add('success-animation');
                    setTimeout(() => card.classList.remove('success-animation'), 600);
                }
            });
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to upgrade profile');
        }
    } catch (error) {
        console.error('Error upgrading profile:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Network error. Please check your connection and try again.');
        } else {
            showError(error.message || 'Failed to upgrade profile. Please try again.');
        }
    } finally {
        // Hide loading state
        setButtonLoading(confirmUpgrade, false);
        cancelUpgrade.disabled = false;
    }
}

// Show success message
function showSuccess(message) {
    showMessage(message, 'success');
}

// Show error message
function showError(message) {
    showMessage(message, 'error');
}

// Show message function
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    if (type === 'success') {
        messageDiv.style.backgroundColor = '#4CAF50';
    } else {
        messageDiv.style.backgroundColor = '#f44336';
    }

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Form error functions
function showFormError(inputElement, message) {
    // Remove existing error
    clearFormErrors(inputElement);

    // Add error class to input
    inputElement.classList.add('form-error');

    // Create and show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    // Insert error message after input
    inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);

    // Focus the input
    inputElement.focus();
}

function clearFormErrors(inputElement = null) {
    if (inputElement) {
        // Clear errors for specific input
        inputElement.classList.remove('form-error');
        const errorMsg = inputElement.parentNode.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    } else {
        // Clear all form errors
        document.querySelectorAll('.form-error').forEach(el => el.classList.remove('form-error'));
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }
}

// Loading functions
function showLoading(message = 'Loading...') {
    loadingOverlay.querySelector('p').textContent = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function setButtonLoading(button, loading = true) {
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
    }
}

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', logout);

async function logout() {
    try {
        // Sign out from Firebase
        await signOut(auth);

        // Clear local storage
        localStorage.removeItem('userId');

        // Redirect to login
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error during logout:', error);
        // Fallback: redirect anyway
        window.location.href = 'login.html';
    }
}

// Photo upload functions
async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid image file (JPEG, PNG, or GIF).');
        return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showError('Image file size must be less than 5MB.');
        return;
    }

    try {
        showLoading('Uploading photo...');

        const formData = new FormData();
        formData.append('photo', file);

        const response = await fetch(`${API_BASE}/user/profile/${currentUser.uid}/photo`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            displayProfile(result.user);

            // Add success animation to the photo
            if (profilePhoto) {
                profilePhoto.classList.add('success-animation');
                setTimeout(() => profilePhoto.classList.remove('success-animation'), 600);
            }

            showSuccess('Profile photo updated successfully!');
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to upload photo');
        }
    } catch (error) {
        console.error('Error uploading photo:', error);
        showError(error.message || 'Failed to upload photo. Please try again.');
    } finally {
        hideLoading();
    }
}

async function removePhoto() {
    try {
        showLoading('Removing photo...');

        const response = await fetch(`${API_BASE}/user/profile/${currentUser.uid}/photo`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const result = await response.json();
            displayProfile(result.user);

            // Add success animation to the photo
            if (profilePhoto) {
                profilePhoto.classList.add('success-animation');
                setTimeout(() => profilePhoto.classList.remove('success-animation'), 600);
            }

            showSuccess('Profile photo removed successfully!');
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to remove photo');
        }
    } catch (error) {
        console.error('Error removing photo:', error);
        showError(error.message || 'Failed to remove photo. Please try again.');
    } finally {
        hideLoading();
    }
}

async function saveProfileForm(event) {
    event.preventDefault();

    try {
        // Clear any existing form errors
        clearFormErrors();

        // Validate input
        const displayNameValue = displayName.value.trim();
        if (!displayNameValue) {
            showFormError(displayName, 'Display name cannot be empty.');
            return;
        }

        if (displayNameValue.length < 2) {
            showFormError(displayName, 'Display name must be at least 2 characters long.');
            return;
        }

        if (displayNameValue.length > 50) {
            showFormError(displayName, 'Display name cannot exceed 50 characters.');
            return;
        }

        // Show loading state
        setButtonLoading(profileForm.querySelector('button[type="submit"]'), true);

        // Use demo userId for now - replace with auth.currentUser.uid later
        const userId = 'demoUserId'; // TODO: Replace with auth.currentUser.uid

        const userRef = ref(db, `users/${userId}`);
        await update(userRef, { name: displayNameValue });

        // Add success animation to the form
        profileForm.classList.add('success-animation');
        setTimeout(() => profileForm.classList.remove('success-animation'), 600);

        showSuccess('Profile updated successfully!');
    } catch (error) {
        console.error('Error saving profile:', error);
        showError(error.message || 'Failed to save profile changes. Please try again.');
    } finally {
        // Hide loading state
        setButtonLoading(profileForm.querySelector('button[type="submit"]'), false);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initProfile);
