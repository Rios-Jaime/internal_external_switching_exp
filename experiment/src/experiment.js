var jsPsych = initJsPsych({
  on_finish: function () {
    jsPsych.data.displayData();
    // Uncomment the following line to redirect participants after finishing
    // window.location = "https://app.prolific.co/submissions/complete?cc=XXXXXXX";

    // Collect experiment data
    const experimentData = jsPsych.data.get().json();

    // Define a function to send data with retry logic
    const sendData = () => {
      fetch("/egner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participant_id: subject_id, // Replace 'subject_id' with the appropriate variable or method to get the participant ID
          data: experimentData,
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

    // Call sendData to initiate the process
    sendData();
  },
});

// capture info from Prolific
//var subject_id = jsPsych.data.getURLVariable("PROLIFIC_PID");
//var study_id = jsPsych.data.getURLVariable("STUDY_ID");
//var session_id = jsPsych.data.getURLVariable("SESSION_ID");

var subject_id = jsPsych.randomization.randomID(8);
var study_id = "attention-test";
var session_id = "ses-1";

jsPsych.data.addProperties({
  subject_id: subject_id,
  study_id: study_id,
  session_id: session_id,
});

/* ************************************ */
/* Define helper functions */
/* ************************************ */

var meanITI = 0.5;
function sampleFromDecayingExponential() {
  // Decay parameter of the exponential distribution λ = 1 / μ
  var lambdaParam = 1 / meanITI;
  var minValue = 0;
  var maxValue = 5;

  /**
   * Sample one value with replacement
   * from a decaying exponential distribution within a specified range.
   *
   * @param {number} lambdaParam
   * - The decay parameter lambda of the exponential distribution.
   * @param {number} minValue - The minimum value of the range.
   * @param {number} maxValue - The maximum value of the range.
   * @returns {number}
   * A single value sampled from the decaying
   * exponential distribution within the specified range.
   */
  var sample;
  do {
    sample = -Math.log(Math.random()) / lambdaParam;
  } while (sample < minValue || sample > maxValue);
  return sample;
}

function shuffleArray(array) {
  // Create a copy of the original array
  const shuffledArray = [...array];

  // Perform Fisher-Yates shuffle
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return shuffledArray;
}

var randomDraw = function (lst) {
  var index = Math.floor(Math.random() * lst.length);
  return lst[index];
};

// Function to randomly sample without replacement, repopulating if necessary
function sampleCueCondition(conditions, currentCueCond, isSwitch) {
  // If conditions array is empty, repopulate and shuffle it
  if (conditions.length === 0) {
    console.log("Repopulating cue conditions...");
    conditions.push(...shuffleArray([...originalCueConditions]));
  }

  // Filter based on whether it's a switch or stay trial
  let filteredConditions = conditions.filter(
    (cond) =>
      isSwitch
        ? cond.cue_cond !== currentCueCond.cue_cond // Switch: Find a different condition
        : cond.cue_cond === currentCueCond.cue_cond // Stay: Find the same condition
  );

  // If no valid options are found for "switch" or "stay", repopulate and retry
  if (filteredConditions.length === 0) {
    console.log("No valid options available. Repopulating...");
    conditions.push(...shuffleArray([...originalCueConditions]));

    // Retry filtering after repopulating
    filteredConditions = conditions.filter((cond) =>
      isSwitch
        ? cond.cue_cond !== currentCueCond.cue_cond
        : cond.cue_cond === currentCueCond.cue_cond
    );

    // If still no options found after repopulating, throw an error
    if (filteredConditions.length === 0) {
      throw new Error("No valid conditions available after repopulating");
    }
  }

  // Select a random item from the filtered list and remove it from the original conditions array
  const index = Math.floor(Math.random() * filteredConditions.length);
  const selectedCondition = filteredConditions[index];

  // Remove the selected condition from the original conditions array
  conditions.splice(conditions.indexOf(selectedCondition), 1);

  return selectedCondition;
}

// function to generate list of image objects
function generateObjectList(objects, category) {
  return objects.map((item) => ({
    name: item,
    image: `${pathSource}${category}/${item}.${fileTypeExtension}`,
  }));
}

/* ************** Getters *************** */

// function to randomly select an image from object categories
function getRandomObject(ref_object) {
  switch (ref_object) {
    case "tool":
      return randomDraw(tool_objects);
    case "sports":
      return randomDraw(sports_objects);
    case "animate":
      return randomDraw(animate_objects);
    default:
      throw new Error("Invalid ref_object value");
  }
}

function getImageUrl(stim) {
  const found = all_images.find((item) => item.name === stim);
  return found ? found.image : null; // Return the image URL if found, otherwise null
}

function getRandomPosition() {
  return Math.random() < 0.5 ? "left" : "right";
}

function getResponseMappings(group_index) {
  var mappings;

  switch (group_index % 4) {
    case 0: // Condition 1
      mappings = {
        smaller: ",",
        larger: ".",
      };
      break;
    case 1: // Condition 2
      mappings = {
        smaller: ".",
        larger: ",",
      };
      break;
  }

  return mappings;
}

const getInstructFeedback = () =>
  `<div class="centerbox"><p class="center-block-text">${feedbackInstructText}</p></div>`;

const getFeedback = () =>
  `<div class="bigbox"><div class="picture_box"><p class="block-text">${feedbackText}</p></div></div>`;

const getExpStage = () => expStage;

const setCTI = () => CTI;

const getCTI = () => CTI;

const getFixation = (color = "black") => `
  <div class="centerbox">
    <div class="fixation" style="font-size: 100px; color: ${color};">+</div>
  </div>
`;

const getCue = () =>
  getFixation(currCue === "internal" ? "#1A85FF" : "#D41159");

const getEncodingStim = () => {
  // Determine the internal stimulus image
  let internalStimImage = "";
  const imageUrl =
    currCue === "internal"
      ? getImageUrl(currStim)
      : getImageUrl(currDistractorStim);

  if (imageUrl) {
    internalStimImage = `<img src="${imageUrl}" alt="${currStim}" style="width: 200px; height: auto;">`;
  } else {
    console.error(
      `Image not found for stimulus: ${
        currCue === "internal" ? currStim : currDistractorStim
      }`
    );
    internalStimImage = `<div>Image not found</div>`;
  }

  // Return the encoding stimulus centered on the screen
  return `
    <div class="centerbox">
      <div class="cue-text" style="margin-top: 20px;">${internalStimImage}</div>
    </div>
  `;
};

const getDecisionStim = () => {
  // Determine the external stimulus based on currCue
  const externalStimImage =
    currCue === "external"
      ? getImageUrl(currStim)
      : getImageUrl(currDistractorStim);
  const targetImage = getImageUrl(currTarget);

  // Randomly decide if the target is on the left or right
  const targetPosition = Math.random() < 0.5 ? "left" : "right";

  // Generate HTML for the stimuli with consistent sizes
  const targetHtml = `<img src="${targetImage}" alt="${currTarget}" style="width: 200px; height: auto; border: 3px solid black;">`;
  const externalHtml = `<img src="${externalStimImage}" alt="external" style="width: 200px; height: auto;">`;

  // Generate the HTML structure with consistent fixation
  return `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="display: flex; justify-content: center; align-items: center; margin-right: 40px;">
        ${targetPosition === "left" ? targetHtml : externalHtml}
      </div>
      <div>${getCue()}</div>
      <div style="display: flex; justify-content: center; align-items: center; margin-left: 40px;">
        ${targetPosition === "left" ? externalHtml : targetHtml}
      </div>
    </div>
  `;
};

const getCurrBlockNum = () =>
  getExpStage() === "practice" ? practiceCount : testCount;

// Task Specific Functions
var getKeys = function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }
  return keys;
};

/* ********** Task Data Functions ********** */

/* Append gap and current trial to data and then recalculate for next trial*/
var appendData = function () {
  var currTrial = jsPsych.getProgress().current_trial_global;
  var trialID = jsPsych.data.get().filter({ trial_index: currTrial })
    .trials[0].trial_id;
  var trialNum = currentTrial - 1; // currentTrial has already been updated with setStims, so subtract one to record data
  var taskSwitch = taskSwitches[trialNum];

  let combinedCondition =
    "task_" + taskSwitch.task_switch + "_cue_" + taskSwitch.cue_switch;

  jsPsych.data.get().addToLast({
    cue: currCue,
    trial_id: trialID,
    attention_mode_condition: currCue,
    reference_object_category: currRefObj,
    task_condition: taskSwitch,
    reference_item: currStim,
    distractor_attention_mode: currDistractorCond,
    distractor_object_category: currDistractorObj,
    distractor_stimulus: currDistractorStim,
    target_object_category: "animate",
    target_item: currTarget,
    current_trial: trialNum,
    correct_response: correctResponse,
    CTI: CTI,
    block_num: getExpStage() == "practice" ? practiceCount : testCount,
  });

  if (trialID == "practice_trial" || trialID == "test_trial") {
    correctTrial = 0;
    if (jsPsych.data.get().last().trials[0].response == correctResponse) {
      correctTrial = 1;
    }
    jsPsych.data.get().addToLast({
      correct_trial: correctTrial,
    });
  }
};

var setStims = function () {
  var tmp;
  console.log(currStim);
  switch (taskSwitches[currentTrial]) {
    case "na":
      tmp = {
        cue_cond: randomDraw(["internal", "external"]),
        ref_object: randomDraw(["tool", "sports"]),
      };

      if (tmp.cue_cond == "internal") {
        distractor_cond = "external";
      } else {
        distractor_cond = "internal";
      }

      if (tmp.ref_object == "tool") {
        distractor_object = "sports";
      } else {
        distractor_object = "tool";
      }
      break;

    case "stay":
      console.log("stay trial marker");
      console.log(cue_conditions);
      console.log(lastTask);
      tmp = sampleCueCondition(cue_conditions, lastTask, false);
      console.log(tmp);

      if (tmp.cue_cond == "internal") {
        distractor_cond = "external";
      } else {
        distractor_cond = "internal";
      }

      if (tmp.ref_object == "tool") {
        distractor_object = "sports";
      } else {
        distractor_object = "tool";
      }
      break;

    case "switch":
      console.log("switch trial marker");
      console.log(cue_conditions);
      console.log(lastTask);

      tmp = sampleCueCondition(cue_conditions, lastTask, true);
      console.log(tmp);

      if (tmp.cue_cond == "internal") {
        distractor_cond = "external";
      } else {
        distractor_cond = "internal";
      }

      if (tmp.ref_object == "tool") {
        distractor_object = "sports";
      } else {
        distractor_object = "tool";
      }
      break;
  }

  console.log(tmp);
  console.log(taskSwitches[currentTrial]);

  lastTask = tmp;
  currCue = tmp.cue_cond;
  currRefObj = tmp.ref_object;

  console.log(currRefObj);

  currStim = getRandomObject(currRefObj);
  currDistractorCond = distractor_cond;
  currDistractorObj = distractor_object;
  currDistractorStim = getRandomObject(currDistractorObj);
  currTarget = getRandomObject("animate");
  currentTrial = currentTrial + 1;
  CTI = setCTI();
  correctResponse = getResponse();
  correct = false;
};

// obtains correct response depending on target
var getResponse = function () {
  switch (currTarget) {
    case "ant":
      if ([].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "bass":
      if (["shuttlecock", "chisel", "screwdriver"].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "bear":
      if (
        [
          "baseball_bat",
          "basketball",
          "bowling_ball",
          "boxing_gloves",
          "football",
          "golf_club",
          "hockey_stick",
          "ice_skate",
          "raquet",
          "shuttlecock",
          "skateboard",
          "soccerball",
          "axe",
          "chainsaw",
          "chisel",
          "crowbar",
          "drill",
          "electric_saw",
          "hammer",
          "hand_saw",
          "hoe",
          "mallet",
          "screwdriver",
          "scythe",
          "shear",
          "shovel",
          "sickle",
          "wrench",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "bluebird":
      if ([].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "buffallo":
      if (
        [
          "baseball_bat",
          "basketball",
          "bicycle",
          "bowling_ball",
          "boxing_gloves",
          "football",
          "hockey_stick",
          "golf_club",
          "ice_skate",
          "raquet",
          "shuttlecock",
          "skateboard",
          "ski",
          "soccerball",
          "axe",
          "chainsaw",
          "chisel",
          "crowbar",
          "drill",
          "electric_saw",
          "hammer",
          "hand_saw",
          "hoe",
          "mallet",
          "screwdriver",
          "scythe",
          "shear",
          "shovel",
          "sickle",
          "wrench",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "butterfly":
      if ([].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "cat":
      if (
        [
          "shuttlecock",
          "basketball",
          "bowling_ball",
          "boxing_gloves",
          "football",
          "soccerball",
          "ice_skate",
          "chisel",
          "crowbar",
          "drill",
          "hammer",
          "hand_saw",
          "mallet",
          "screwdriver",
          "wrench",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "caterpillar":
      if ([].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "cockroach":
      if ([].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "goat":
      if (
        [
          "baseball_bat",
          "basketball",
          "bowling_ball",
          "boxing_gloves",
          "football",
          "golf_club",
          "hockey_stick",
          "ice_skate",
          "raquet",
          "shuttlecock",
          "skateboard",
          "ski",
          "soccerball",
          "axe",
          "chainsaw",
          "chisel",
          "crowbar",
          "drill",
          "electric_saw",
          "hammer",
          "hand_saw",
          "hoe",
          "mallet",
          "screwdriver",
          "shear",
          "shovel",
          "sickle",
          "wrench",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "gorilla":
      if (
        [
          "baseball_bat",
          "basketball",
          "bicycle",
          "bowling_ball",
          "boxing_gloves",
          "football",
          "golf_club",
          "hockey_stick",
          "ice_skate",
          "raquet",
          "shuttlecock",
          "skateboard",
          "ski",
          "soccerball",
          "axe",
          "chainsaw",
          "chisel",
          "crowbar",
          "drill",
          "electric_saw",
          "hammer",
          "hand_saw",
          "hoe",
          "mallet",
          "screwdriver",
          "shear",
          "shovel",
          "sickle",
          "wrench",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "hedgehog":
      if (
        [
          "basketball",
          "bowling_ball",
          "boxing_gloves",
          "football",
          "ice_skate",
          "shuttlecock",
          "soccerball",
          "chisel",
          "drill",
          "electric_saw",
          "hammer",
          "hand_saw",
          "mallet",
          "screwdriver",
          "shear",
          "wrench",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "rabbit":
      if (
        [
          "basketball",
          "bowling_ball",
          "boxing_gloves",
          "football",
          "ice_skate",
          "shuttlecock",
          "soccerball",
          "chisel",
          "drill",
          "hammer",
          "hand_saw",
          "mallet",
          "screwdriver",
          "shear",
          "wrench",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "scorpion":
      if ([].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "seahorse":
      if (["shuttlecock", "chisel"].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "sombra":
      if (
        [
          "baseball_bat",
          "basketball",
          "bowling_ball",
          "boxing_gloves",
          "football",
          "ice_skate",
          "raquet",
          "shuttlecock",
          "skateboard",
          "soccerball",
          "axe",
          "chainsaw",
          "chisel",
          "crowbar",
          "drill",
          "electric_saw",
          "hammer",
          "hand_saw",
          "mallet",
          "screwdriver",
          "shear",
          "shovel",
          "sickle",
          "wrench",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    default:
      console.log(currTarget);
      throw new Error("Invalid target");
  }
};
/* ************************************ */
/* Define experimental variables */
/* ************************************ */

// Generic Task Variables
var group_index =
  typeof window.efVars !== "undefined" ? window.efVars.group_index : 1;

var expID = "cued_task_switching_rdoc";
var expStage = "practice";

const possibleResponses = [
  ["index finger", ",", "comma key (,)"],
  ["middle finger", ".", "period (.)"],
];

const choices = [possibleResponses[0][1], possibleResponses[1][1]];
var responseMappings = getResponseMappings(group_index);

// Toggle Attention Checks
var runAttentionChecks = false;

// Threshold Parameters
var sumInstructTime = 0; // ms
var instructTimeThresh = 5; // in seconds
var accuracyThresh = 0.8;
var practiceAccuracyThresh = 0.8; //
var rtThresh = 1000;
var missedResponseThresh = 0.1;
var practiceThresh = 3;

// Task Length Parameters
var practiceLen = 8;
var numTestBlocks = 1;
var numTrialsPerBlock = 8; // should be multiple of 24

// Trial Timing Paramters
const stimStimulusDuration = 1500;
const stimTrialDuration = 2000;
const cueStimulusDuration = 250;
const cueTrialDuration = 250;
const encodingPhaseDuration = 1000;
const memorandaDuration = 250;
const fixationDuration = 500;
var CTI = 250;

// Trial Stimulus Variables
var lastTask = "na"; // object that holds the last task, set by setStims()
var currCue = "na"; // object that holds the current cue, set by setStims()
var cueI = randomDraw([0, 1]); // index for one of two cues of the current task
var currStim = "na"; // object that holds the current stim, set by setStims()
var currentTrial = 0;

let taskSwitchesArr = Array(4).fill("stay").concat(Array(4).fill("switch"));
taskSwitchesArr = shuffleArray(taskSwitchesArr);

let originalCueConditions = [
  { cue_cond: "internal", ref_object: "sports" },
  { cue_cond: "internal", ref_object: "tool" },
  { cue_cond: "external", ref_object: "sports" },
  { cue_cond: "external", ref_object: "tool" },
  { cue_cond: "internal", ref_object: "sports" },
  { cue_cond: "internal", ref_object: "tool" },
  { cue_cond: "external", ref_object: "sports" },
  { cue_cond: "external", ref_object: "tool" },
];

// Shuffle the existing array
let cue_conditions = shuffleArray([...originalCueConditions]);

console.log(cue_conditions);

var tasks = {
  internal: {
    task: "internal",
    cue: "internal",
  },
  external: {
    task: "external",
    cue: "external",
  },
};

// Image Variables
var fileTypeExtension = "png";
var preFileType =
  "<img class='center' src='/images/"; // Adjusted to match static file serving

var trialExamplePath = pathSource + "trial_example/trial_example.png";

console.log(trialExamplePath)

// PRE LOAD IMAGES HERE
var pathSource = "/images/";

var tool_objects = [
  "axe",
  "chainsaw",
  "chisel",
  "crowbar",
  "drill",
  "electric_saw",
  "hammer",
  "hand_saw",
  "hoe",
  "mallet",
  "screwdriver",
  "scythe",
  "shear",
  "shovel",
  "sickle",
  "wrench",
];
var sports_objects = [
  "baseball_bat",
  "basketball",
  "bicycle",
  "bowling_ball",
  "boxing_gloves",
  "canoe",
  "football",
  "golf_club",
  "hockey_stick",
  "ice_skate",
  "raquet",
  "shuttlecock",
  "skateboard",
  "ski",
  "soccerball",
  "surfboard",
];
var animate_objects = [
  "ant",
  "elephant",
  "bear",
  "bluebird",
  "buffalo",
  "butterfly",
  "horse",
  "caterpillar",
  "cockroach",
  "giraffe",
  "gorilla",
  "rhinoceros",
  "rabbit",
  "scorpion",
  "seahorse",
  "sombra",
];

// Generate lists of objects with names and image paths
const animate_images = generateObjectList(animate_objects, "animate");
const sports_images = generateObjectList(sports_objects, "sports");
const tool_images = generateObjectList(tool_objects, "tools");

// Combine all images into a single array for preloading
const all_images = [...animate_images, ...sports_images, ...tool_images];

// Extract only the image URLs for preloading
const imageUrls = all_images.map((item) => item.image);

// Text Variables
var fixation = getFixation();

var endText = `
  <div class="centerbox">
    <p class="center-block-text">Thanks for completing this task!</p>
    <p class="center-block-text">Press <i>enter</i> to continue.</p>
  </div>
`;

var speedReminder = `
  <p class="block-text">
    Try to respond as quickly and accurately as possible.
  </p>
`;

const responseKeys = `<p class='block-text'>Press the <b>${possibleResponses[0][2]}</b> if the target is larger and the <b>${possibleResponses[1][2]}</b> if the target is smaller than the referent object.</p>`;
var currStim = "";

var feedbackInstructText = `
  <p class="center-block-text">
    Welcome! This experiment will take around 45 minutes.
  </p>
  <p class="center-block-text">
    To avoid technical issues, please keep the experiment tab (on Chrome or Firefox) active and in fullscreen mode for the whole duration of each task.
  </p>
  <p class="center-block-text"> Press <i>enter</i> to begin.</p>
`;

var feedbackText =
  "<div class = centerbox><p class = center-block-text>Press <i>enter</i> to begin practice.</p></div>";

var promptTextList = `
  <ul style="text-align:center;font-size:24px; ">
    Press <b>comma key (,)</b> if the target is <b>${
      responseMappings.smaller === "," ? "smaller" : "larger"
    }</b> and <b>period key (.)</b> if the target is <b>${
  responseMappings.smaller === "," ? "larger" : "smaller"
}</b>
  </ul>
`;

var promptText = `
  <div style="
    position: absolute; 
    top: 5%; 
    left: 5%; 
    transform: translate(-5%, -5%);
    text-align: left; 
    font-size: 16px; 
    line-height: 1.2;">
    <p><b>comma key (,)</b> if <b>${
      responseMappings.smaller === "," ? "smaller" : "larger"
    }</b> and 
    <b>period key (.)</b> if <b>${
      responseMappings.smaller === "," ? "larger" : "smaller"
    }</b> <br> <span style="display: inline-block; width: 20px; height: 20px; background-color: #D41159; margin-bottom: -4px; border: 1px solid black;"></span> fixation indicated memory and <span style="display: inline-block; width: 20px; height: 20px; background-color: #1A85FF; margin-bottom: -4px; border: 1px solid black;"></span> fixation indicated perception item.
    </p>
  </div>
`;

var pageInstruct = [
  `
  <div class="centerbox">
    <p class="block-text">During each trial of this task, you will first see one object image presented by itself, which you have to keep in memory. This is followed by a colored fixation cross ( <span style="display: inline-block; width: 20px; height: 20px; background-color: #1A85FF; margin-bottom: -4px; border: 1px solid black;"></span>  or  <span style="display: inline-block; width: 20px; height: 20px; background-color: #D41159; margin-bottom: -4px; border: 1px solid black;"></span> ), and then by two object images shown side-by-side. Your task will be to judge whether one of the objects shown side-by-side (the &ldquo;target&rdquo;, shown with a black frame around it) is larger or smaller than one of the other two objects (&ldquo;reference items&rdquo;). In some trials, you will have to compare the target to the object you are holding in memory; in other trials, you will have to compare the target to the object shown next to it on the screen. Which object you need to compare the target to will be indicated by the color ( <span style="display: inline-block; width: 20px; height: 20px; background-color: #1A85FF; margin-bottom: -4px; border: 1px solid black;"></span>  or  <span style="display: inline-block; width: 20px; height: 20px; background-color: #D41159; margin-bottom: -4px; border: 1px solid black;"></span> ) of the fixation cross shown on the screen between the memory object and the target screen.</p>
    
    <div class="center-image">
      <img src="${trialExamplePath}" alt="Memory Object" style="max-width: 1500px; height: auto;">
    </div>

    <p class="block-text">Place your right-hand index finger on the <b>comma key (,)</b> and your right-hand middle finger on the <b>period key (.)</b></p>

    <p class="block-text">If the cue is <span style="display: inline-block; width: 20px; height: 20px; background-color: #D41159; margin-bottom: -4px; border: 1px solid black;"></span> then compare the target to the reference item held in memory (internal item). If the cue is <span style="display: inline-block; width: 20px; height: 20px; background-color: #1A85FF; margin-bottom: -4px; border: 1px solid black;"></span> then compare the target to the reference item shown alongside it on the screen (external item).</p>

  </div>
  `,
  `

    <div class="center-image">
      <img src="${trialExamplePath}" alt="Memory Object" style="max-width: 1500px; height: auto;">
    </div>

  <div class="centerbox">
    <p class="block-text">Again your task will be to judge whether the target is smaller or larger than the cued reference item. The finger mappings are shown below:</p>
    ${promptTextList}

    <p class="block-text">Looking at the example trial above, the <span style="display: inline-block; width: 20px; height: 20px; background-color: #D41159; margin-bottom: -4px; border: 1px solid black;"></span> cue indicates that on this trial you would need to compare the target to the item held in memory. Because the target (insert object name) is larger than the item held in memory (insert object name), you would press the index finger (comma) button.</p>

    <p class="block-text">We'll start with a practice round. During practice, you will receive feedback and a reminder of the rules. These will be taken out for the test, so make sure you understand the instructions before moving on.</p>
    ${speedReminder}
  </div>
  `,
];

/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */

var fullscreen = {
  type: jsPsychFullscreen,
  fullscreen_mode: true,
};

var exitFullscreen = {
  type: jsPsychFullscreen,
  fullscreen_mode: false,
};

var instructionsBlock = {
  type: jsPsychInstructions,
  data: {
    trial_id: "instructions",
    trial_duration: null,
    stimulus: pageInstruct,
  },
  pages: pageInstruct,
  allow_keys: false,
  show_clickable_nav: true,
};

var feedbackInstructBlock = {
  type: jsPsychHtmlKeyboardResponse,
  data: {
    trial_id: "instruction_feedback",
    trial_duration: 180000,
  },
  choices: ["Enter"],
  stimulus: getInstructFeedback,
  trial_duration: 180000,
};

var instructionNode = {
  timeline: [feedbackInstructBlock, instructionsBlock],
  loop_function: function () {
    data = jsPsych.data.get().filter({ trial_id: "instructions" }).trials;
    for (i = 0; i < data.length; i++) {
      if (data[i].rt != null) {
        sumInstructTime += data[i].rt;
      }
    }
    if (sumInstructTime <= instructTimeThresh * 1000) {
      feedbackInstructText =
        "<p class=block-text>Read through instructions too quickly. Please take your time and make sure you understand the instructions.</p><p class=block-text>Press <i>enter</i> to continue.</p>";
      return true;
    } else if (sumInstructTime > instructTimeThresh * 1000) {
      feedbackInstructText =
        "<p class=block-text>Done with instructions. Press <i>enter</i> to continue.</p>";
      return false;
    }
  },
};

/* define practice and test blocks */
var setStimsBlock = {
  type: jsPsychCallFunction,
  data: {
    trial_id: "set_stims",
    trial_duration: null,
  },
  func: setStims,
};

var feedbackBlock = {
  type: jsPsychHtmlKeyboardResponse,
  data: function () {
    const stage = getExpStage();
    return {
      trial_id: `${stage}_feedback`,
      exp_stage: stage,
      trial_duration: 60000,
      block_num: stage === "practice" ? practiceCount : testCount,
    };
  },
  choices: ["Enter"],
  stimulus: getFeedback,
  trial_duration: 60000,
  response_ends_trial: true,
};

var practiceTrials = [];
for (var i = 0; i < practiceLen + 1; i++) {
  var practiceFixationBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: fixation,
    choices: ["NO_KEYS"],
    data: {
      trial_id: "practice_fixation",
      exp_stage: "practice",
      trial_duration: fixationDuration,
      stimulus_duration: fixationDuration,
    },
    stimulus_duration: fixationDuration, // 500
    trial_duration: fixationDuration, // 500
    prompt: promptText,
    on_finish: function (data) {
      data["block_num"] = practiceCount;
    },
  };

  var practiceCueBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: getCue,
    choices: ["NO_KEYS"],
    data: {
      trial_id: "practice_cue",
      exp_stage: "practice",
      trial_duration: getCTI(),
      stimulus_duration: getCTI(),
    },
    trial_duration: getCTI,
    stimulus_duration: getCTI,

    prompt: promptText,
    on_finish: appendData,
  };

  var practiceEncodigBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: getEncodingStim,
    choices: ["NO_KEYS"],
    data: {
      trial_id: "practice_cue",
      exp_stage: "practice",
      trial_duration: encodingPhaseDuration,
      stimulus_duration: memorandaDuration,
    },
    trial_duration: encodingPhaseDuration,
    stimulus_duration: memorandaDuration,

    prompt: promptText,
    on_finish: appendData,
  };

  var ITIms = null;

  // *** ITI *** //
  var ITIBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: fixation,
    is_html: true,
    choices: ["NO_KEYS"],
    data: function () {
      const stage = getExpStage();
      return {
        trial_id: `${stage}_ITI`,
        ITIParams: {
          min: 0,
          max: 5,
          mean: 0.5,
        },
        block_num: stage === "practice" ? practiceCount : testCount,
        exp_stage: stage,
      };
    },

    trial_duration: function () {
      ITIms = sampleFromDecayingExponential();
      return ITIms * 1000;
    },
    prompt: function () {
      return getExpStage() === "practice" ? promptText : "";
    },
    on_finish: function (data) {
      data["trial_duration"] = ITIms * 1000;
      data["stimulus_duration"] = ITIms * 1000;
    },
  };

  var practiceTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: getDecisionStim,
    choices: choices,
    data: {
      exp_stage: "practice",
      trial_id: "practice_trial",
      choices: choices,
      trial_duration: stimTrialDuration,
      stimulus_duration: stimStimulusDuration,
    },

    stimulus_duration: stimStimulusDuration, // 1000
    trial_duration: stimTrialDuration, // 1500
    response_ends_trial: false,
    prompt: promptText,
    on_finish: appendData,
  };

  var practiceFeedbackBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
      var last = jsPsych.data.get().last(1).values()[0];
      if (last.response == null) {
        return "<div class = center-box><div class=center-text><font size =20>Respond Faster!</font></div></div>";
      } else if (last.correct_trial == 1) {
        return "<div class = center-box><div class=center-text><font size =20 >Correct!</font></div></div>";
      } else {
        return "<div class = center-box><div class=center-text><font size =20 >Incorrect</font></div></div>";
      }
    },
    data: function () {
      return {
        exp_stage: "practice",
        trial_id: "practice_feedback",
        trial_duration: 500,
        stimulus_duration: 500,
        block_num: practiceCount,
      };
    },
    choices: ["NO_KEYS"],
    stimulus_duration: 500,
    trial_duration: 500,
    prompt: promptText,
  };

  practiceTrials.push(
    setStimsBlock,
    practiceFixationBlock,
    practiceEncodigBlock,
    practiceCueBlock,
    practiceTrial,
    practiceFeedbackBlock,
    ITIBlock
  );
}

var practiceCount = 0;
var practiceNode = {
  timeline: [feedbackBlock].concat(practiceTrials),
  loop_function: function (data) {
    practiceCount += 1;
    currentTrial = 0;

    var sumRT = 0;
    var sumResponses = 0;
    var correct = 0;
    var totalTrials = 0;

    for (var i = 0; i < data.trials.length; i++) {
      if (
        data.trials[i].trial_id == "practice_trial" &&
        data.trials[i].block_num == getCurrBlockNum() - 1
      ) {
        totalTrials += 1;
        if (data.trials[i].rt != null) {
          sumRT += data.trials[i].rt;
          sumResponses += 1;
          if (data.trials[i].response == data.trials[i].correct_response) {
            correct += 1;
          }
        }
      }
    }

    var accuracy = correct / totalTrials;
    var missedResponses = (totalTrials - sumResponses) / totalTrials;
    var avgRT = sumRT / sumResponses;

    if (
      accuracy >= practiceAccuracyThresh ||
      practiceCount === practiceThresh
    ) {
      feedbackText = `
        <div class="centerbox">
          <p class="center-block-text">We will now start the test portion.</p>
          <p class="block-text">Keep your <b>index finger</b> on the <b>comma key (,)</b> and your <b>middle finger</b> on the <b>period key (.)</b></p>
          <p class="block-text">Press <i>enter</i> to continue.</p>
        </div>
      `;

      taskSwitches = jsPsych.randomization.repeat(
        taskSwitchesArr,
        numTrialsPerBlock / 8
      );
      taskSwitches.unshift("na");
      expStage = "test";
      return false;
    } else {
      feedbackText =
        "<div class = centerbox><p class = block-text>Please take this time to read your feedback! This screen will advance automatically in 1 minute.</p>";

      if (accuracy < practiceAccuracyThresh) {
        feedbackText += `
          <p class="block-text">Your accuracy is low. Remember:</p>
          ${promptTextList}
        `;
      }

      if (avgRT > rtThresh) {
        feedbackText += `
          <p class="block-text">You have been responding too slowly.</p>
          ${speedReminder}
        `;
      }

      if (missedResponses > missedResponseThresh) {
        feedbackText += `
          <p class="block-text">You have not been responding to some trials. Please respond on every trial that requires a response.</p>
        `;
      }

      feedbackText +=
        `<p class="block-text">We are now going to repeat the practice round.</p>` +
        `<p class="block-text">Press <i>enter</i> to begin.</p></div>`;

      taskSwitches = jsPsych.randomization.repeat(
        taskSwitchesArr,
        practiceLen / 8
      );
      taskSwitches.unshift("na");
      return true;
    }
  },
};

var endBlock = {
  type: jsPsychHtmlKeyboardResponse,
  data: {
    trial_id: "end",
    exp_id: expID,
    trial_duration: 180000,
  },
  trial_duration: 180000,
  stimulus: endText,
  choices: ["Enter"],
};

var internal_external_experiment = [];
var internal_external_experiment_init = () => {
  console.log(all_images);

  jsPsych.pluginAPI.preloadImages(imageUrls);

  taskSwitches = jsPsych.randomization.repeat(taskSwitchesArr, practiceLen / 8);
  taskSwitches.unshift("na");

  console.log(taskSwitches);

  internal_external_experiment.push(fullscreen);
  internal_external_experiment.push(instructionNode);
  internal_external_experiment.push(practiceNode);
  //internal_external_experiment.push(testNode);
  internal_external_experiment.push(endBlock);
  internal_external_experiment.push(exitFullscreen);
};

// Call to initialize the experiment
internal_external_experiment_init();

// Run the experiment using the initialized timeline
jsPsych.run(internal_external_experiment);
