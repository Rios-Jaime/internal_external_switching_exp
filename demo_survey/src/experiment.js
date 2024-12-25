var jsPsych = initJsPsych({
  on_finish: function () {
    // Collect experiment data
    const experimentData = jsPsych.data.get().json();

    // Add metadata
    const fullData = {
      participant_id: subject_id,
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
          const surveys = new URLSearchParams(window.location.search).get(
            "surveys"
          );
          window.location.href =
            `/next?progress=demo_survey&surveys=${surveys}`;
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

// capture info from Prolific
//var subject_id = jsPsych.data.getURLVariable("PROLIFIC_PID");
//var study_id = jsPsych.data.getURLVariable("STUDY_ID");
//var session_id = jsPsych.data.getURLVariable("SESSION_ID");

var subject_id = jsPsych.randomization.randomID(8);
var study_id = "attention-test";
var session_id = "ses-1";
var task_id = "demo_survey";

jsPsych.data.addProperties({
  subject_id: subject_id,
  study_id: study_id,
  session_id: session_id,
  task_id: task_id,
});

const demographicSurvey = {
  type: jsPsychSurveyMultiChoice,
  preamble: `<h3>Demographic Survey</h3><p>Please answer the following questions:</p>`,
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
    {
      prompt: "Age (in years):",
      type: "text", // Specify this as a text input
      placeholder: "Enter your age",
      required: true,
      name: "age",
    },
  ],
  on_finish: function (data) {
    console.log("Demographic Survey Responses:", data.response);
  },
};

// Free-text survey for "Other" options
const demographicFreeTextSurvey = {
  type: jsPsychSurveyText,
  preamble: `<h3>Additional Information</h3><p>Please answer only if you selected "Other" in the previous survey:</p>`,
  questions: [
    {
      prompt: "If you selected 'Other' for gender, please specify:",
      rows: 1,
      columns: 50,
      name: "gender_other",
      required: false,
    },
    {
      prompt: "If you selected 'Other' for race, please specify:",
      rows: 1,
      columns: 50,
      name: "race_other",
      required: false,
    },
  ],
  on_finish: function (data) {
    console.log("Free text responses:", data.response);
  },
};

// Conditional logic for showing free text survey
const conditionalSurveyNode = {
  timeline: [demographicFreeTextSurvey],
  conditional_function: function () {
    const lastResponse = jsPsych.data.getLastTrialData().values()[0].response;

    // Check if "Other" was selected for gender or race
    const showFreeTextSurvey =
      lastResponse.gender === "Other" || lastResponse.race === "Other";

    return showFreeTextSurvey;
  },
};

// Timeline setup
const timeline = [
  {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
  },
  demographicSurvey,
  conditionalSurveyNode,
  {
    type: jsPsychFullscreen,
    fullscreen_mode: false,
  },
];

// Run the jsPsych experiment
jsPsych.run(timeline);
