// Extract participant_id from query parameters
const urlParams = new URLSearchParams(window.location.search);
const participant_id = urlParams.get("participant_id");

var jsPsych = initJsPsych({
  on_finish: function () {
    // ✅ Extract participant_id from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const participant_id = urlParams.get("participant_id");

    // ✅ Ensure correct survey order
    const surveys = JSON.parse(
      decodeURIComponent(urlParams.get("surveys") || "[]")
    );

    // ✅ Get the current survey progress
    const currentSurvey = urlParams.get("progress");
    const currentSurveyIndex = surveys.indexOf(currentSurvey);
    const nextSurveyIndex = currentSurveyIndex + 1;
    const nextSurvey = surveys[nextSurveyIndex];

    // ✅ Dynamically set task_id based on current survey
    const task_id = currentSurvey || "demo_survey";

    // ✅ Collect experiment data
    const experimentData = jsPsych.data.get().json();
    const fullData = {
      participant_id: participant_id,
      session_id: "ses-1",
      study_id: "attention_mode_switching_study",
      task_id: task_id,
      data: experimentData,
    };

    console.log("📩 Sending Experiment Data:", fullData);

    // ✅ Function to send data before moving forward
    const sendData = () => {
      fetch("/save_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullData),
      })
        .then((response) => {
          if (response.ok) {
            console.log("✅ Data successfully sent");

            // ✅ Move to the next survey or finish study
            if (nextSurvey) {
              console.log(`✅ Moving to next survey: ${nextSurvey}`);
              window.location.href = `/next?progress=${nextSurvey}&surveys=${encodeURIComponent(
                JSON.stringify(surveys)
              )}&participant_id=${participant_id}`;
            } else {
              console.log(
                "🎉 All surveys completed, redirecting to SONA credit page."
              );
              window.location.href = `https://duke-psy-credit.sona-systems.com/webstudy_credit.aspx?experiment_id=1693&credit_token=3ed9ddbbd30f4957bb7f1d43c1478ba5&survey_code=${participant_id}`;
            }
          } else {
            console.error("❌ Failed to send data, retrying...");
            setTimeout(sendData, 3000);
          }
        })
        .catch((error) => {
          console.error("❌ Error sending data:", error);
          setTimeout(sendData, 3000);
        });
    };

    sendData();
  },
});

var study_id = "attention_mode_switching_study";
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
