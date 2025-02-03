// Extract participant_id from query parameters
const urlParams = new URLSearchParams(window.location.search);
const participant_id = urlParams.get("participant_id");

var jsPsych = initJsPsych({
  on_finish: function () {
    // Collect experiment data
    const experimentData = jsPsych.data.get().json();

    // Add metadata
    const fullData = {
      participant_id: participant_id,
      session_id: session_id,
      study_id: study_id,
      task_id: task_id,
      data: experimentData,
    };

    // Send data to the server
    const sendData = () => {
      fetch("/egner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fullData),
      })
        .then((response) => {
          if (response.ok) {
            console.log("Data successfully sent to server");
          } else {
            console.error("Failed to send data to server; retrying...");
            setTimeout(sendData, 3000); // Retry after 3 seconds
          }
          // Redirect to /next with progress and surveys
          const surveys = urlParams.get("surveys");
          window.location.href = `/next?progress=demo_survey&surveys=${surveys}&participant_id=${participant_id}`;
        })
        .catch((error) => {
          console.error("Error sending data:", error);
          setTimeout(sendData, 3000); // Retry after 3 seconds
        });
    };

    sendData();
    console.log("Experiment data:", fullData);
  },
});

var study_id = "attention-test";
var session_id = "ses-1";
var task_id = "demo_survey";

jsPsych.data.addProperties({
  participant_id: participant_id,
  study_id: study_id,
  session_id: session_id,
  task_id: task_id,
});

const demographicSurvey = {
  type: jsPsychSurveyMultiChoice,
  preamble: `<h3>Demographic Survey</h3><p>Please answer the following questions (remember you can scroll through the questions using your trackpad or mouse):</p>`,
  questions: [
    {
      prompt: "Gender:",
      options: ["Female", "Male", "Other", "Do not wish to respond"],
      required: true,
      name: "gender",
    },
    {
      prompt: "Biological Sex:",
      options: ["Female", "Male", "Intersex", "Do not wish to respond"],
      required: true,
      name: "biological_sex",
    },
    {
      prompt: "Race:",
      options: [
        "American Indian/Alaska Native",
        "Asian",
        "Native Hawaiian/Other Pacific Islander",
        "Black/African American",
        "White/Caucasian",
        "Multiracial",
        "Other",
        "Do not wish to respond",
      ],
      required: true,
      name: "race",
    },
    {
      prompt: "Are you Hispanic?",
      options: ["Yes", "No", "Do not wish to respond"],
      required: true,
      name: "hispanic",
    },
  ],
  on_finish: function (data) {
    console.log("Demographic Survey Responses:", data.response);
  },
};

// Add a separate survey for the age question
const ageSurvey = {
  type: jsPsychSurveyText,
  preamble: `<h3>Demographic Survey - Age</h3>`,
  questions: [
    {
      prompt: "Age (in years):",
      rows: 1,
      columns: 5,
      placeholder: "Enter your age",
      name: "age",
      required: true,
    },
  ],
  on_finish: function (data) {
    console.log("Age Response:", data.response);
  },
};

// Dynamic free-text survey for "Other" options
const demographicFreeTextSurvey = {
  type: jsPsychSurveyText,
  preamble: `<h3>Additional Information</h3><p>Please answer only if you selected "Other" in the previous survey:</p>`,
  questions: function () {
    // Retrieve the response data from the demographic survey
    const demographicData = jsPsych.data
      .get()
      .filter({
        trial_type: "survey-multi-choice",
      })
      .values();

    if (demographicData.length > 0) {
      const lastResponse = demographicData[demographicData.length - 1].response;
      const questions = [];

      // Add a text box for gender if "Other" was selected
      if (lastResponse.gender === "Other") {
        questions.push({
          prompt: "If you selected 'Other' for gender, please specify:",
          rows: 1,
          columns: 50,
          name: "gender_other",
          required: true, // Make it required since they selected "Other"
        });
      }

      // Add a text box for race if "Other" was selected
      if (lastResponse.race === "Other") {
        questions.push({
          prompt: "If you selected 'Other' for race, please specify:",
          rows: 1,
          columns: 50,
          name: "race_other",
          required: true, // Make it required since they selected "Other"
        });
      }

      return questions;
    }

    return []; // Default to no questions if no "Other" was selected
  },
  on_finish: function (data) {
    console.log("Free text responses:", data.response);
  },
};

// Timeline setup
const timeline = [
  {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
  },
  demographicSurvey,
  {
    timeline: [demographicFreeTextSurvey],
    conditional_function: function () {
      // Retrieve the response data from the demographic survey
      const demographicData = jsPsych.data
        .get()
        .filter({
          trial_type: "survey-multi-choice",
        })
        .values();

      if (demographicData.length > 0) {
        const lastResponse =
          demographicData[demographicData.length - 1].response;

        // Show the free-text survey only if "Other" was selected for gender or race
        return lastResponse.gender === "Other" || lastResponse.race === "Other";
      }

      return false; // Default to false if no data is found
    },
  },
  ageSurvey,
  {
    type: jsPsychFullscreen,
    fullscreen_mode: false,
  },
];

// Run the jsPsych experiment
jsPsych.run(timeline);
