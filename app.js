// Replace with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// --- General Helper Functions ---
function showMessage(message, isError = false) {
    alert(message); // Simple alert for now, you can replace with a more sophisticated UI notification
    if (isError) {
        console.error(message);
    } else {
        console.log(message);
    }
}

function redirectTo(path) {
    window.location.href = path;
}

// --- Authentication and User Management ---

// Admin Credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Healmed2025!"; // This should be securely hashed in a real application!

// Function to handle patient account creation
async function createPatientAccount(fullName, email, phoneNumber, gender, username, password) {
    try {
        // Create user with Firebase Authentication (Email/Password)
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;

        // Save additional patient data to Realtime Database
        await database.ref('patients/' + userId).set({
            fullName: fullName,
            email: email,
            phoneNumber: phoneNumber,
            gender: gender,
            username: username, // Store username for custom login (Firebase Auth uses email/password)
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        showMessage("Account created successfully! You can now log in.");
        redirectTo('index.html');
    } catch (error) {
        showMessage(`Error creating account: ${error.message}`, true);
    }
}

// Function to handle login (both patient and admin)
async function handleLogin(username, password) {
    // Check for admin login
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // For admin, we don't use Firebase Auth, just a simple credential check
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        showMessage("Admin login successful!");
        redirectTo('admin-portal.html');
        return;
    }

    // Try patient login using Firebase Authentication
    try {
        // Find the user by username to get their email (assuming username is unique and stored with email)
        const usersRef = database.ref('patients');
        const snapshot = await usersRef.orderByChild('username').equalTo(username).limitToFirst(1).once('value');

        if (snapshot.exists()) {
            const userData = snapshot.val();
            const userId = Object.keys(userData)[0];
            const patientEmail = userData[userId].email;

            await auth.signInWithEmailAndPassword(patientEmail, password);
            showMessage("Patient login successful!");
            redirectTo('patient-portal.html');
        } else {
            showMessage("Invalid username or password.", true);
        }
    } catch (error) {
        showMessage(`Login failed: ${error.message}`, true);
    }
}


// Function to handle logout
async function handleLogout(isAdmin = false) {
    if (isAdmin) {
        sessionStorage.removeItem('isAdminLoggedIn');
        showMessage("Admin logged out.");
        redirectTo('index.html');
    } else {
        try {
            await auth.signOut();
            showMessage("Logged out successfully.");
            redirectTo('index.html');
        } catch (error) {
            showMessage(`Logout failed: ${error.message}`, true);
        }
    }
}

// --- Patient Portal Functions ---

function loadPatientData(userId) {
    database.ref('patients/' + userId).once('value', (snapshot) => {
        const patientData = snapshot.val();
        if (patientData) {
            document.getElementById('patientName').textContent = patientData.fullName;
        }
    });
}

// Mental Health Tests (Simplified - you'd implement actual questions/scoring)
const mentalHealthTests = {
    depression: {
        title: "Depression Screening Test",
        questions: [
            "Little interest or pleasure in doing things?",
            "Feeling down, depressed, or hopeless?",
            "Trouble falling or staying asleep, or sleeping too much?",
            "Feeling tired or having little energy?",
            "Poor appetite or overeating?",
            // ... more questions
        ],
        // You'd add scoring logic here
    },
    anxiety: {
        title: "Anxiety Screening Test",
        questions: [
            "Feeling nervous, anxious, or on edge?",
            "Not being able to stop or control worrying?",
            "Worrying too much about different things?",
            "Trouble relaxing?",
            // ... more questions
        ],
    },
    adhd: {
        title: "ADHD Screening Test",
        questions: [
            "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been completed?",
            "How often do you have difficulty getting things in order when you have a task that requires organization?",
            "How often do you have problems remembering appointments or obligations?",
            // ... more questions
        ],
    }
};

function displayTest(testType) {
    const testArea = document.getElementById('testArea');
    testArea.innerHTML = `<h3>${mentalHealthTests[testType].title}</h3>`;
    mentalHealthTests[testType].questions.forEach((question, index) => {
        testArea.innerHTML += `<p>${index + 1}. ${question}</p>
                                <label><input type="radio" name="${testType}-q${index}" value="0"> Not at all</label>
                                <label><input type="radio" name="${testType}-q${index}" value="1"> Several days</label>
                                <label><input type="radio" name="${testType}-q${index}" value="2"> More than half the days</label>
                                <label><input type="radio" name="${testType}-q${index}" value="3"> Nearly every day</label><br><br>`;
    });
    testArea.innerHTML += `<button id="submitTestBtn" data-test-type="${testType}">Submit Test</button>`;
}

async function submitTestResults(testType, userId) {
    const testArea = document.getElementById('testArea');
    const questions = mentalHealthTests[testType].questions;
    let score = 0;
    let answers = [];

    for (let i = 0; i < questions.length; i++) {
        const selectedOption = document.querySelector(`input[name="${testType}-q${i}"]:checked`);
        if (selectedOption) {
            const answerValue = parseInt(selectedOption.value);
            score += answerValue;
            answers.push({ question: questions[i], answer: answerValue });
        } else {
            showMessage("Please answer all questions.", true);
            return;
        }
    }

    // Determine result breakdown (simplified)
    let breakdown = "No significant concerns identified.";
    if (score > 10 && testType === 'depression') {
        breakdown = "Moderate depression symptoms observed. Consider seeking professional help.";
    } else if (score > 8 && testType === 'anxiety') {
        breakdown = "Moderate anxiety symptoms observed. Consider seeking professional help.";
    } else if (score > 6 && testType === 'adhd') {
        breakdown = "Significant ADHD symptoms observed. Further evaluation recommended.";
    }


    const testResultRef = database.ref('testResults').push();
    const resultId = testResultRef.key;

    const resultData = {
        userId: userId,
        testType: testType,
        score: score,
        breakdown: breakdown,
        answers: answers,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    await testResultRef.set(resultData);
    showMessage(`${testType.charAt(0).toUpperCase() + testType.slice(1)} Test results submitted!`);
    testArea.innerHTML = ''; // Clear test area

    loadPatientTestResults(userId); // Refresh patient's results
}

function loadPatientTestResults(userId) {
    const testResultsList = document.getElementById('testResultsList');
    testResultsList.innerHTML = ''; // Clear previous results

    database.ref('testResults').orderByChild('userId').equalTo(userId).on('value', (snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const result = childSnapshot.val();
                const timestamp = new Date(result.timestamp).toLocaleString();
                const listItem = document.createElement('li');
                listItem.classList.add('result-item');
                listItem.innerHTML = `
                    <strong>${result.testType.toUpperCase()} Test (${timestamp}):</strong><br>
                    Score: ${result.score}<br>
                    Breakdown: ${result.breakdown}
                `;
                testResultsList.appendChild(listItem);
            });
        } else {
            testResultsList.innerHTML = '<li>No test results yet.</li>';
        }
    }, (error) => {
        console.error("Error loading patient test results:", error);
    });
}


async function bookAppointment(fullName, email, phoneNumber, preferredDate, preferredTime, reasonForVisit, userId) {
    const appointmentRef = database.ref('appointments').push();
    await appointmentRef.set({
        userId: userId,
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        reasonForVisit: reasonForVisit,
        status: 'pending', // pending, approved, denied
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    showMessage("Appointment request submitted successfully!");
}

function loadPatientAppointments(userId) {
    const patientAppointmentsList = document.getElementById('patientAppointmentsList');
    patientAppointmentsList.innerHTML = '';

    database.ref('appointments').orderByChild('userId').equalTo(userId).on('value', (snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const appt = childSnapshot.val();
                const timestamp = new Date(appt.timestamp).toLocaleString();
                const listItem = document.createElement('li');
                listItem.classList.add('appointment-item');
                listItem.innerHTML = `
                    <strong>Date:</strong> ${appt.preferredDate}, <strong>Time:</strong> ${appt.preferredTime}<br>
                    <strong>Reason:</strong> ${appt.reasonForVisit}<br>
                    <strong>Status:</strong> <span style="color: ${appt.status === 'approved' ? 'green' : (appt.status === 'denied' ? 'red' : 'orange')}">${appt.status.toUpperCase()}</span>
                `;
                patientAppointmentsList.appendChild(listItem);
            });
        } else {
            patientAppointmentsList.innerHTML = '<li>No appointments booked yet.</li>';
        }
    }, (error) => {
        console.error("Error loading patient appointments:", error);
    });
}

// --- Admin Portal Functions ---

function loadAllTestResults() {
    const allTestResultsList = document.getElementById('allTestResultsList');
    allTestResultsList.innerHTML = '';

    database.ref('testResults').on('value', async (snapshot) => {
        if (snapshot.exists()) {
            allTestResultsList.innerHTML = ''; // Clear existing
            const resultsPromises = [];
            snapshot.forEach((childSnapshot) => {
                const result = childSnapshot.val();
                resultsPromises.push(
                    database.ref('patients/' + result.userId).once('value').then(patientSnap => {
                        const patient = patientSnap.val();
                        return { result: result, patient: patient };
                    })
                );
            });
            const allResults = await Promise.all(resultsPromises);
            allResults.sort((a, b) => b.result.timestamp - a.result.timestamp); // Sort by newest

            allResults.forEach(({ result, patient }) => {
                const timestamp = new Date(result.timestamp).toLocaleString();
                const listItem = document.createElement('li');
                listItem.classList.add('result-item');
                listItem.innerHTML = `
                    <strong>Patient:</strong> ${patient ? patient.fullName : 'N/A'} (Email: ${patient ? patient.email : 'N/A'})<br>
                    <strong>Test Type:</strong> ${result.testType.toUpperCase()}<br>
                    <strong>Date:</strong> ${timestamp}<br>
                    <strong>Score:</strong> ${result.score}<br>
                    <strong>Breakdown:</strong> ${result.breakdown}
                `;
                allTestResultsList.appendChild(listItem);
            });
        } else {
            allTestResultsList.innerHTML = '<li>No patient test results yet.</li>';
        }
    }, (error) => {
        console.error("Error loading all test results:", error);
    });
}

function loadPendingAppointments() {
    const pendingAppointmentsList = document.getElementById('pendingAppointmentsList');
    pendingAppointmentsList.innerHTML = '';

    database.ref('appointments').orderByChild('status').equalTo('pending').on('value', (snapshot) => {
        if (snapshot.exists()) {
            pendingAppointmentsList.innerHTML = ''; // Clear existing
            snapshot.forEach((childSnapshot) => {
                const apptId = childSnapshot.key;
                const appt = childSnapshot.val();
                const timestamp = new Date(appt.timestamp).toLocaleString();
                const listItem = document.createElement('li');
                listItem.classList.add('pending-appointment');
                listItem.innerHTML = `
                    <strong>Patient:</strong> ${appt.fullName} (Email: ${appt.email}, Phone: ${appt.phoneNumber})<br>
                    <strong>Requested Date/Time:</strong> ${appt.preferredDate} at ${appt.preferredTime}<br>
                    <strong>Reason:</strong> ${appt.reasonForVisit}<br>
                    <strong>Requested On:</strong> ${timestamp}<br>
                    <button class="approve-btn" data-id="${apptId}">Approve</button>
                    <button class="deny-btn" data-id="${apptId}">Deny</button>
                `;
                pendingAppointmentsList.appendChild(listItem);
            });
        } else {
            pendingAppointmentsList.innerHTML = '<li>No pending appointments.</li>';
        }
    }, (error) => {
        console.error("Error loading pending appointments:", error);
    });
}

async function updateAppointmentStatus(apptId, status) {
    try {
        await database.ref('appointments/' + apptId).update({ status: status });
        showMessage(`Appointment ${status}ed successfully!`);
    } catch (error) {
        showMessage(`Error updating appointment status: ${error.message}`, true);
    }
}

function loadApprovedAppointments() {
    const approvedAppointmentsCalendar = document.getElementById('approvedAppointmentsCalendar');
    approvedAppointmentsCalendar.innerHTML = '';

    database.ref('appointments').orderByChild('status').equalTo('approved').on('value', (snapshot) => {
        if (snapshot.exists()) {
            approvedAppointmentsCalendar.innerHTML = '<h3>Approved Appointments</h3>'; // Clear and add header
            const approvedAppointments = [];
            snapshot.forEach((childSnapshot) => {
                approvedAppointments.push(childSnapshot.val());
            });

            // Sort by date and time
            approvedAppointments.sort((a, b) => {
                const dateA = new Date(`${a.preferredDate}T${a.preferredTime}`);
                const dateB = new Date(`${b.preferredDate}T${b.preferredTime}`);
                return dateA - dateB;
            });

            approvedAppointments.forEach(appt => {
                const listItem = document.createElement('div');
                listItem.classList.add('approved-appointment');
                listItem.innerHTML = `
                    <strong>${appt.preferredDate} at ${appt.preferredTime}</strong><br>
                    Patient: ${appt.fullName} (Email: ${appt.email})<br>
                    Reason: ${appt.reasonForVisit}
                `;
                approvedAppointmentsCalendar.appendChild(listItem);
            });
        } else {
            approvedAppointmentsCalendar.innerHTML = '<h3>No approved appointments yet.</h3>';
        }
    }, (error) => {
        console.error("Error loading approved appointments:", error);
    });
}


// --- Event Listeners and Page Load Logic ---

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page is loaded
    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/') {
        // Login Page
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                handleLogin(username, password);
            });
        }
    } else if (path.includes('create-account.html')) {
        // Create Account Page
        const createAccountForm = document.getElementById('createAccountForm');
        if (createAccountForm) {
            createAccountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fullName = document.getElementById('fullName').value;
                const email = document.getElementById('email').value;
                const phoneNumber = document.getElementById('phoneNumber').value;
                const gender = document.getElementById('gender').value;
                const newUsername = document.getElementById('newUsername').value;
                const newPassword = document.getElementById('newPassword').value;
                createPatientAccount(fullName, email, phoneNumber, gender, newUsername, newPassword);
            });
        }
    } else if (path.includes('patient-portal.html')) {
        // Patient Portal Page
        auth.onAuthStateChanged((user) => {
            if (user) {
                loadPatientData(user.uid);
                loadPatientTestResults(user.uid);
                loadPatientAppointments(user.uid);

                document.getElementById('logoutBtn').addEventListener('click', () => handleLogout(false));

                document.getElementById('takeDepressionTest').addEventListener('click', () => displayTest('depression'));
                document.getElementById('takeAnxietyTest').addEventListener('click', () => displayTest('anxiety'));
                document.getElementById('takeADHDTest').addEventListener('click', () => displayTest('adhd'));

                document.getElementById('testArea').addEventListener('click', (e) => {
                    if (e.target.id === 'submitTestBtn') {
                        const testType = e.target.dataset.testType;
                        submitTestResults(testType, user.uid);
                    }
                });

                const bookAppointmentForm = document.getElementById('bookAppointmentForm');
                if (bookAppointmentForm) {
                    bookAppointmentForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const apptFullName = document.getElementById('apptFullName').value;
                        const apptEmail = document.getElementById('apptEmail').value;
                        const apptPhoneNumber = document.getElementById('apptPhoneNumber').value;
                        const preferredDate = document.getElementById('preferredDate').value;
                        const preferredTime = document.getElementById('preferredTime').value;
                        const reasonForVisit = document.getElementById('reasonForVisit').value;
                        bookAppointment(apptFullName, apptEmail, apptPhoneNumber, preferredDate, preferredTime, reasonForVisit, user.uid);
                    });
                }

            } else {
                redirectTo('index.html'); // Redirect to login if not authenticated
            }
        });
    } else if (path.includes('admin-portal.html')) {
        // Admin Portal Page
        if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
            redirectTo('index.html'); // Redirect to login if not admin
        } else {
            loadAllTestResults();
            loadPendingAppointments();
            loadApprovedAppointments();

            document.getElementById('adminLogoutBtn').addEventListener('click', () => handleLogout(true));

            document.getElementById('pendingAppointmentsList').addEventListener('click', (e) => {
                if (e.target.classList.contains('approve-btn')) {
                    const apptId = e.target.dataset.id;
                    updateAppointmentStatus(apptId, 'approved');
                } else if (e.target.classList.contains('deny-btn')) {
                    const apptId = e.target.dataset.id;
                    updateAppointmentStatus(apptId, 'denied');
                }
            });
        }
    }
});
