// Extract participant_id from query parameters
const urlParams = new URLSearchParams(window.location.search);
const participant_id = urlParams.get("participant_id");

var jsPsych = initJsPsych({
  on_finish: function () {
    // ✅ Extract participant_id from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const participant_id = urlParams.get("participant_id");

    // ✅ Ensure correct survey order
    const surveys = JSON.parse(decodeURIComponent(urlParams.get("surveys") || "[]"));

    // ✅ Get the current survey progress
    const currentSurvey = urlParams.get("progress");
    const currentSurveyIndex = surveys.indexOf(currentSurvey);
    const nextSurveyIndex = currentSurveyIndex + 1;
    const nextSurvey = surveys[nextSurveyIndex];

    // ✅ Dynamically set task_id based on current survey
    const task_id = currentSurvey || "unknown_survey"; // Fallback in case of error

    // ✅ Collect survey data
    const surveyData = jsPsych.data.get().json();
    const fullData = {
      participant_id: participant_id,
      session_id: "ses-1",
      study_id: "attention_mode_switching_study",
      task_id: task_id,
      data: surveyData,
    };

    console.log("📩 Sending Survey Data:", fullData);

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
              window.location.href = `/next?progress=${nextSurvey}&surveys=${encodeURIComponent(JSON.stringify(surveys))}&participant_id=${participant_id}`;
            } else {
              console.log("🎉 All surveys completed, redirecting to SONA credit page.");
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
var task_id = "mwq_survey";

jsPsych.data.addProperties({
  participant_id: participant_id,
  study_id: study_id,
  session_id: session_id,
  task_id: task_id,
});

var likert_scale = [
  "1: Almost Never",
  "2: Very Infrequently",
  "3: Somewhat Infrequently",
  "4: Somewhat Frequently",
  "5: Very Frequently",
  "6: Almost Always",
];

var instructionsBlock = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class='instructions'>
      <p>Welcome to this survey.</p>
      <p>For each of the following statements, please indicate how often you currently have each experience. Remember you can scroll using the mouse or trackpad if need be. Be sure to answer all questions in order to move forward.</p>
      <p>Press <b>enter</b> to begin.</p>
    </div>`,
  choices: ["Enter"],
  data: {
    trial_id: "instructions",
    trial_duration: 180000,
  },
  trial_duration: 180000,
  post_trial_gap: 0,
};

var trial = {
  type: jsPsychSurveyLikert,
  preamble: `<p>Indicate how often you currently have each experience.</p>`,
  questions: [
    {
      prompt:
        "I have difficulty maintaining focus on simple or repetitive work.",
      name: "question_1",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "While reading, I find I haven't been thinking about the text and must therefore read it again.",
      name: "question_2",
      labels: likert_scale,
      required: true,
    },
    {
      prompt: "I do things without paying full attention.",
      name: "question_3",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I find myself listening with one ear, thinking about something else at the same time.",
      name: "question_4",
      labels: likert_scale,
      required: true,
    },
    {
      prompt: "I mind-wander during lectures or presentations.",
      name: "question_5",
      labels: likert_scale,
      required: true,
    },
  ],
  randomize_question_order: false,
  on_finish: function (data) {
    // Log the Likert scale mappings
    data.likert_scale_mappings = likert_scale;

    // Create an array to log prompts with their corresponding responses
    let promptResponsePairs = [];

    for (let question of this.questions) {
      const responseValue = data.response[question.name]; // Get response for the question
      promptResponsePairs.push({
        prompt: question.prompt,
        response: responseValue,
      });
    }

    // Log the prompts and responses together
    data.prompt_response_pairs = promptResponsePairs;

    console.log("Survey Data with Prompts and Responses:", data);
  },
};

var mwq_survey = [
  { type: jsPsychFullscreen, fullscreen_mode: true },
  instructionsBlock,
  trial,
  {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="centerbox">
        <p class="center-block-text">Thanks for completing this task!</p>
        <p class="center-block-text">Press <i>enter</i> to continue.</p>
      </div>`,
    choices: ["Enter"],
  },
  { type: jsPsychFullscreen, fullscreen_mode: false },
];

jsPsych.run(mwq_survey);
