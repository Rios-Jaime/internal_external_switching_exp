// Function to get query parameters from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Extract sona_id from URL and use it as participant_id
const participant_id = getQueryParam("sona_id");

var study_id = "attention_mode_switching_study";
var session_id = "ses-1";
var task_id = "consent";

if (!participant_id) {
  alert(
    "Error: Missing SONA ID. Please start the study from the correct link."
  );
  window.location.href = "https://www.google.com"; // Redirect to an error page or exit
}

const consentForm = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="text-align: left; max-width: 800px; margin: auto;">
      <h2>Consent Form to Participate in Research Study on Attention Switching</h2>
      
      <h3>KEY INFORMATION</h3>
      <p>This research study is conducted by Dr. Tobias Egner at the Center for Cognitive Neuroscience at Duke University. Its purpose is to examine how people switch between paying attention to internal memory and external stimuli in the world.</p>
      
      <h3>PROCEDURE</h3>
      <p>In this experiment, you will be shown pictures of objects and asked to classify one object as being either smaller or larger than another object. The entire experiment is expected to take about <b>60 minutes</b>.</p>
      
      <h3>RISKS & BENEFITS</h3>
      <p>We know of no risks or benefits to you for participating in this research study. The potential benefits of this research lie in the knowledge that will be acquired.</p>
      
      <h3>CONFIDENTIALITY</h3>
      <p>Our records will include the demographic information that you report (age, gender, etc.) as well as your task performance data and questionnaire responses. We employ a participant code system to ensure that this information is not directly linked to your name or consent form. The consent and demographics, the de-identified performance and questionnaire data, and any code sheet that links your personal information to your data will be placed on our secure computer network, both of which can only be accessed by trained study personnel. All data will be kept for at least six years or as long as is required by Duke University or any journal that may publish these findings. If a report of this study is published or presented, only group results will be reported. In case that the data is published in a public repository of scientific data, only task performance alongside any applicable survey data will be shared, without any demographic information being included.</p>
      
      <h3>COMPENSATION & PARTICIPATION</h3>
      <p>For participating in this study, you will earn one course credit per hour of participation for a maximum of 1 credit. Your participation is voluntary. You can discontinue participation at any time for any reason.</p>
      
      <h3>CONTACT</h3>
      <p>If you have additional questions regarding this study, contact Professor Tobias Egner at (+1) 919-684-1049 or <a href="mailto:tobias.egner@duke.edu">tobias.egner@duke.edu</a>. If you have any questions about your rights as a research subject, you may contact the Human Subjects Protection at <a>campusirb@duke.edu</a>.Please reference protocol ID# <b>2025-0174</b>.</p>

      <p><b>Please click to indicate your consent to participate in the study.</b></p>
    </div>
  `,
  choices: [
    "I have read the above consent form and agree to participate in the study",
    "I do not agree to participate in the study.",
  ],
  on_finish: function (data) {
    const consentGiven = data.response === 0; // 0 = Agreed, 1 = Did not agree

    if (consentGiven) {
      // Send consent data to the server and continue to the next step
      fetch("/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participant_id,
          consent_given: true,
        }),
      }).then(() => {
        // Move to the next part of the study
        window.location.href = `/next?progress=consent&participant_id=${participant_id}`;
      });
    } else {
      // Send data to server and exit study
      fetch("/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participant_id,
          consent_given: false,
        }),
      }).then(() => {
        // Display exit message instead of redirecting
        document.body.innerHTML = `
          <div style="text-align: center; margin-top: 50px;">
            <h2>You have opted to not participate in the study.</h2>
            <p>Please close this window.</p>
          </div>
        `;
      });
    }
  },
};

// Initialize jsPsych timeline with the consent form
const timeline = [consentForm];

const jsPsych = initJsPsych({
  on_finish: function () {
    console.log("Consent form completed.");
  },
});

jsPsych.run(timeline);
