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
          window.location.href = `/next?progress=demo_survey&surveys=${surveys}`;
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

const demographicSurveyWithConditionalFields = {
  type: jsPsychSurvey,
  pages: [
    [
      {
        type: "multi-choice",
        prompt: "Gender:",
        options: ["Female", "Male", "Other", "Do not wish to respond"],
        name: "gender",
        required: true,
        allow_other_text: true,
      },
      {
        type: "multi-choice",
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
        name: "race",
        required: true,
        allow_other_text: true,
      },
    ],
  ],
  on_finish: function (data) {
    const response = data.response;
    const genderOther = response.gender === "Other" ? response["gender-other"] : null;
    const raceOther = response.race === "Other" ? response["race-other"] : null;

    console.log("Responses:", response);
    console.log("Gender (Other):", genderOther);
    console.log("Race (Other):", raceOther);
  },
};

// Full timeline setup
const timeline = [
  {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
  },
  demographicSurveyWithConditionalFields,
  {
    type: jsPsychFullscreen,
    fullscreen_mode: false,
  },
];

// Run the jsPsych experiment
jsPsych.run(timeline);
