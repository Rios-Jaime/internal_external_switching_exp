var jsPsych = initJsPsych({
  on_finish: function () {
    jsPsych.data.displayData();

    //Collect experiment data
    const experimentData = jsPsych.data.get().json();

    // Define a function to send data with retry logic
    const sendData = () => {
      fetch("/egner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participant_id: subject_id,
          data: experimentData,
          assignedCondition: assignedCondition,
        }),
      })
        .then((response) => {
          if (response.ok) {
            console.log("Data successfully sent to server");
          } else {
            console.error("Failed to send data to server; retrying...");
            setTimeout(sendData, 3000); // Retry after 3 seconds
          }
        })
        .catch((error) => {
          console.error("Error sending data:", error);
          setTimeout(sendData, 3000); // Retry after 3 seconds
        });
    };

    // Call sendData to initiate the upload to the server
    sendData();

    console.log("Experiment data:", experimentData);
  },
});

// capture info from Prolific
//var subject_id = jsPsych.data.getURLVariable("PROLIFIC_PID");
//var study_id = jsPsych.data.getURLVariable("STUDY_ID");
//var session_id = jsPsych.data.getURLVariable("SESSION_ID");

var subject_id = jsPsych.randomization.randomID(8);
var study_id = "attention-test";
var session_id = "ses-1";
var task_id = "mwq_survey";

jsPsych.data.addProperties({
  subject_id: subject_id,
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
      <p>For each of the following statements, please indicate how often you currently have each experience.</p>
      <p>Press <b>enter</b> to begin.</p>
    </div>`,
  choices: ["Enter"],
};

var trial = {
  type: jsPsychSurveyLikert,
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
