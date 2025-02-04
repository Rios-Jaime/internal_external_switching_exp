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
          window.location.href = `/next?progress=maas_survey&surveys=${surveys}&participant_id=${participant_id}`;
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

var study_id = "attention_mode_switching_study";
var session_id = "ses-1";
var task_id = "maas_survey";

jsPsych.data.addProperties({
  participant_id: participant_id,
  study_id: study_id,
  session_id: session_id,
  task_id: task_id,
});

var likert_scale = [
  "1: Almost Always",
  "2: Very Frequently",
  "3: Somewhat Frequently",
  "4: Somewhat Infrequently",
  "5: Very Infrequently",
  "6: Almost Never",
];

var instructionsBlock = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class='instructions'>
      <p>Welcome to this survey.</p>
      <p>You will be shown a collection of statements about your everyday experience. Using the 1-6 scale shown, please indicate how frequently or infrequently you currently have each experience. Please answer according to what really reflects your experiences rather than what you think your experience should be. Please treat each item seperately from every other item. Lastly, remember you can scroll through the questions using the trackpad or mouse if needed. Be sure to answer all the questions in order to move forward.</p>
      <p>Press <b>enter</b> to begin.</p>
    </div>`,
  choices: ["Enter"],
  trial_duration: 180000,
  data: {
    trial_id: "instructions",
    trial_duration: 180000,
  },
  post_trial_gap: 0,
};

var trial = {
  type: jsPsychSurveyLikert,
  preamble: `<p>Please indicate how frequently or infrequently you currently have each experience.</p>`,
  questions: [
    {
      prompt:
        "I could be experiencing some emotion and not be conscious of it untill some time later.",
      name: "question_1",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I break or spill things because of carelessness, not paying attention, or thinking of something else.",
      name: "question_2",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I find it difficult to stay focused on what's happening in the present.",
      name: "question_3",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I tend to walk quickly to get where I'm going without paying attention to what I experience along the way.",
      name: "question_4",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I tend not to notice feelings of physical tension or discomfort until they really grab my attention.",
      name: "question_5",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I forget a person's name almost as soon as I've been told it for the first time.",
      name: "question_6",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        'It seems I am "running on automatic," without much awareness of what I\'m doing.',
      name: "question_7",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I rush through activities without being really attentive to them.",
      name: "question_8",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I get so focused on the goal I want to achieve that I lose touch with what I'm doing right now to get there",
      name: "question_9",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I do jobs or tasks automatically, without being aware of what I'm doing.",
      name: "question_10",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I find myself listening to someone with one ear, doing something else at the same time.",
      name: "question_11",
      labels: likert_scale,
      required: true,
    },
    {
      prompt:
        "I drive places on 'automatic pilot' and then wonder why I went there.",
      name: "question_12",
      labels: likert_scale,
      required: true,
    },
    {
      prompt: "I find myself preoccupied with the future or the past.",
      name: "question_13",
      labels: likert_scale,
      required: true,
    },
    {
      prompt: "I find myself doing things without paying attention.",
      name: "question_14",
      labels: likert_scale,
      required: true,
    },
    {
      prompt: "I snack without being aware that I'm eating.",
      name: "question_15",
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

var maas_survey = [
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

jsPsych.run(maas_survey);
