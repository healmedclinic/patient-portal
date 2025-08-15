# HealMed Clinic – Patient Portal

**Live Site:** [https://healmedclinic.github.io/patient-portal/](https://healmedclinic.github.io/patient-portal/)  
**GitHub Repo:** [https://github.com/healmedclinic/patient-portal](https://github.com/healmedclinic/patient-portal)

---
## Table of Contents
- [UI/UX Design](#Patient-Portal-UI/UX-Design)
- [About the Project](#About-the-Project)
- [Firebase Rules](#Firebase-Rules-for-Patient-Portal-Backend)
- [What You Can Do](#What-You-Can-Do)
- [Tech Used](#Tech-Used)
- [Running it Locally](#Running-It-Locally)

## Patient Portal UI/UX Design
![Model](https://github.com/healmedclinic/patient-portal/blob/main/patient%20portal.jpg)


## About the Project

This is the official patient portal for HealMed Clinic. I built it to make it easier for patients, staff, and doctors to connect in one place. Through the portal, patients can book appointments, take mental health assessments, fill out daily TMS questionnaires, and manage their records-all without having to call the front desk.  

There’s also an admin section for staff to handle appointments, manage patient accounts, and review test results, plus a dedicated doctor portal for clinical use.

---

## Firebase Rules for Patient Portal Backend


    {
    "rules":{
    "publicTmsQuestionnaires": {
      ".read": "true",
      ".write": "true"
    },
    "publicMentalHealthTestSubmissions": {
      ".read": "true",
      ".write": "true"
    },

    // Patient profiles:
    // A user can only read and write their own profile.
    // The admin (with their specific UID) can also write to any patient profile.
    "patients": {
      // You might want to make this more restrictive to "auth.uid == $uid"
      // if patients should only read their own profile, not all profiles.
      // If "auth != null" is truly intended for all patient profiles (e.g., for an admin view), keep it.
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && (auth.uid == $uid || auth.uid == 'iYJB6UPVeNMam5MEFIa8EdyBjP53')"
      }
    },

    // Appointments:
    // Any authenticated user can read all appointments (for calendar view, etc.).
    // A user can create new appointments.
    // Only the owner of an appointment OR the admin can update/delete it.
    "appointments": {
      ".read": "auth != null", // Any authenticated user can read all appointments
      "$appointmentId": {
        // For writing (creating or updating):
        // Allow if authenticated AND (the userId of the NEW data matches current user's UID OR current user is admin)
        // OR (the userId of the EXISTING data matches current user's UID OR current user is admin)
        // The `newData` ensures new creations work. The `data` ensures updates to existing appointments work.
        ".write": "auth != null && (newData.child('userId').val() == auth.uid || data.child('userId').val() == auth.uid || auth.uid == 'iYJB6UPVeNMam5MEFIa8EdyBjP53')",
        // For reading:
        // Allow if authenticated AND (the userId of the existing data matches current user's UID OR current user is admin)
        // This makes sure patients only read their own appointments, but admins can read all.
        ".read": "auth != null && (data.child('userId').val() == auth.uid || auth.uid == 'iYJB6UPVeNMam5MEFIa8EdyBjP53')"
      }
    },

    // Test Results:
    // Any authenticated user can read all test results (for admin view, etc.).
    // A user can create new test results.
    // Only the owner of a test result OR the admin can update/delete it.
    "testResults": {
      ".read": "auth != null", // Any authenticated user can read all test results
      "$testResultId": {
        // Same logic as appointments for write: use newData for creation, data for updates
        ".write": "auth != null && (newData.child('userId').val() == auth.uid || data.child('userId').val() == auth.uid || auth.uid == 'iYJB6UPVeNMam5MEFIa8EdyBjP53')",
        // Make sure patients only read their own test results
        ".read": "auth != null && (data.child('userId').val() == auth.uid || auth.uid == 'iYJB6UPVeNMam5MEFIa8EdyBjP53')"
      }
    },

    "tmsQuestionnaires": {
      ".read": "auth != null", // Any authenticated user can read all TMS questionnaires (for admin view)
      "$uid": {
        // This allows the user ($uid) to read/write their own specific submissions
        // And allows the admin to read/write any user's submissions
        ".read": "auth != null && (auth.uid == $uid || auth.uid == 'iYJB6UPVeNMam5MEFIa8EdyBjP53')",
        "$submissionId": {
          // For writing to a specific submission:
          // Check if current user is the owner ($uid) of the parent path OR is the admin
          // newData.child('userId').val() could also be used here if 'userId' is part of the submission data,
          // but if the structure is /tmsQuestionnaires/$uid/$submissionId, then $uid is already the owner.
          ".write": "auth != null && (auth.uid == $uid || auth.uid == 'iYJB6UPVeNMam5MEFIa8EdyBjP53')",
          // For reading a specific submission:
          ".read": "auth != null && (auth.uid == $uid || auth.uid == 'iYJB6UPVeNMam5MEFIa8EdyBjP53')"
        }
      }
    }
    }
    }

## What You Can Do

### For Patients
- **Create an Account & Log In:** Start by registering and logging in to access your dashboard.
- **Mental Health Assessments:** Take PHQ-9 (depression), GAD-7 (anxiety), and ADHD screenings.
- **TMS Daily Questionnaire:** Fill out a quick daily check-in (nutrition, sleep, medications, etc.).
- **Book Appointments:** Submit a request to schedule a visit.
- **View Your Records:** See past tests, appointments, and your profile info.
- **Quick Access Forms:** New patient form, TMS consent, ID/insurance upload, and more.

### For Admins
- Manage appointment requests.
- Add, edit, and remove patient accounts.
- Review all submitted tests and questionnaires.
- Assign results to the correct patient profiles.
- Redirect to the doctor portal when needed.

### For Doctors
- View assigned patient results and daily questionnaires.
- Access the information you need for upcoming appointments.

---

## Tech Used
- **HTML, CSS, JavaScript** (no heavy frameworks—kept it simple and fast)
- **Embedded Forms** (Google Forms, JotForm, etc.)
- Hosted through **GitHub Pages**

---

## Running It Locally

1. Clone this repo:
   ```bash
   git clone https://github.com/healmedclinic/patient-portal.git
   cd patient-portal
