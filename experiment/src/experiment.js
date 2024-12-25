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
      assignedCondition: assignedCondition,
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

          // Redirect to /next for the first survey
          window.location.href = "/next?progress=experiment";
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
var task_id = "internal_external_exp";

jsPsych.data.addProperties({
  subject_id: subject_id,
  study_id: study_id,
  session_id: session_id,
  task_id: task_id,
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

// Function to get a random item from a list and remove it (without replacement)
function getRandomItemWithoutReplacement(array, originalArray) {
  if (array.length === 0) {
    // Repopulate the array when it's empty
    array.push(...originalArray);
  }
  // Randomly select an index
  const randomIndex = Math.floor(Math.random() * array.length);
  // Remove the selected item and return it
  return array.splice(randomIndex, 1)[0];
}

/* ************** Getters *************** */

// Function to randomly select an image from object categories
function getRandomObject(ref_object) {
  switch (ref_object) {
    case "tool":
      return getRandomItemWithoutReplacement(
        remainingToolObjects,
        tool_objects
      );
    case "sports":
      return getRandomItemWithoutReplacement(
        remainingSportsObjects,
        sports_objects
      );
    case "animate":
      return getRandomItemWithoutReplacement(
        remainingAnimateObjects,
        animate_objects
      );
    default:
      console.log(ref_object);
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

const getInstructFeedback = () =>
  `<div class="centerbox"><p class="block-text">${feedbackInstructText}</p></div>`;

const getFeedback = () =>
  `<div class="bigbox"><div class="picture_box"><p class="block-text">${feedbackText}</p></div></div>`;

const getExpStage = () => expStage;

const setCTI = () => CTI;

const getCTI = () => CTI;

const getFixation = (color = "black") => `
  <div class="fixation" style="font-size: 100px; color: ${color}; text-align: center; line-height: 1;">+</div>
`;

const getCue = () =>
  getFixation(currCue === "internal" ? internalColor : externalColor);

const getEncodingStim = () => {
  // Determine the internal stimulus image
  let internalStimImage = "";
  const imageUrl =
    currCue === "internal"
      ? getImageUrl(currStim)
      : getImageUrl(currDistractorStim);

  if (imageUrl) {
    internalStimImage = `<img src="${imageUrl}" alt="${currStim}" class="stimuli internal-stimuli">`;
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
      <div>${internalStimImage}</div>
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

  // Generate HTML for the stimuli with consistent sizes and alignment
  const targetHtml = `<img src="${targetImage}" alt="${currTarget}" class="stimuli target-stimuli">`;
  const externalHtml = `<img src="${externalStimImage}" alt="external" class="stimuli external-stimuli"">`;

  // Generate the HTML structure
  return `
    <div class="decision-stim-container">
      <div class="stimulus-block"">
        ${targetPosition === "left" ? targetHtml : externalHtml}
      </div>
      <div class="cue-block">
        ${getCue()}
      </div>
      <div class="stimulus-block">
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

  jsPsych.data.get().addToLast({
    cue: currCue,
    trial_id: trialID,
    trialType: trialType,
    attention_mode_condition: currCue,
    reference_object_category: currRefObj,
    task_condition: task_switch,
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

var setStims = function (trial) {
  console.log(trial);

  if (trial.cue_cond == "internal") {
    distractor_cond = "external";
  } else {
    distractor_cond = "internal";
  }

  if (trial.ref_object == "tool") {
    distractor_object = "sports";
  } else {
    distractor_object = "tool";
  }

  trialType = trial.trial_type;

  currCue = trial.cue_cond;
  currRefObj = trial.ref_object;

  console.log(currRefObj);
  task_switch = trial.task_switch;

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

function generateBalancedTrialsFixed(numTrials = 40) {
  // Initialize the condition pool with equal counts for each condition
  const conditionCounts = {};
  conditions.forEach(
    (condition) =>
      (conditionCounts[condition] = Math.floor(numTrials / conditions.length))
  );

  const trials = [];
  let lastCueCond = null;
  let lastRefObject = null;

  // Generate the first trial (na)
  const naTrial = {
    trial_type: "na",
    cue_cond: ["internal", "external"][Math.floor(Math.random() * 2)],
    ref_object: ["sports", "tool"][Math.floor(Math.random() * 2)],
    task_switch: "na",
  };
  trials.push(naTrial);
  lastCueCond = naTrial.cue_cond;
  lastRefObject = naTrial.ref_object;

  for (let i = 0; i < numTrials; i++) {
    let validConditions = [];

    // Filter conditions based on "switch" or "repeat"
    conditions.forEach((condition) => {
      if (conditionCounts[condition] > 0) {
        const [taskSwitch, cueCond, refObject] = condition.split("_");
        if (
          (taskSwitch === "repeat" &&
            cueCond === lastCueCond &&
            refObject === lastRefObject) ||
          (taskSwitch === "switch" && cueCond !== lastCueCond)
        ) {
          validConditions.push(condition);
        }
      }
    });

    if (validConditions.length === 0) {
      console.log("No valid conditions left. Relaxing constraints...");
      // Relax the constraints and sample from any remaining conditions
      validConditions = conditions.filter(
        (condition) => conditionCounts[condition] > 0
      );
    }

    if (validConditions.length === 0) {
      throw new Error(
        "No valid conditions left, even after relaxing constraints."
      );
    }

    // Randomly select a valid condition
    const selectedCondition =
      validConditions[Math.floor(Math.random() * validConditions.length)];
    conditionCounts[selectedCondition] -= 1;

    // Parse the selected condition
    const [taskSwitch, cueCond, refObject] = selectedCondition.split("_");
    const trial = {
      trial_type: selectedCondition,
      cue_cond: cueCond,
      ref_object: refObject,
      task_switch: taskSwitch,
    };
    trials.push(trial);

    // Update the last trial info
    lastCueCond = cueCond;
    lastRefObject = refObject;
  }

  return { trials, conditionCounts };
}

// obtains correct response depending on target
var getResponse = function () {
  switch (currTarget) {
    case "ant":
      if ([].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "bear":
      if (
        [
          "boxing_gloves",
          "ice_skate",
          "shuttlecock",
          "skateboard",
          "soccerball",
          "chainsaw",
          "crowbar",
          "drill",
          "hammer",
          "mallet",
          "screwdriver",
          "wrench",
          "golf_ball",
          "wheelbarrow",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "buffalo":
      if (
        [
          "boxing_gloves",
          "ice_skate",
          "shuttlecock",
          "skateboard",
          "soccerball",
          "chainsaw",
          "crowbar",
          "drill",
          "hammer",
          "mallet",
          "screwdriver",
          "wrench",
          "golf_ball",
          "wheelbarrow",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "butterfly":
      if (["golf_ball"].includes(currStim)) {
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

    case "gorilla":
      if (
        [
          "boxing_gloves",
          "ice_skate",
          "shuttlecock",
          "skateboard",
          "soccerball",
          "chainsaw",
          "crowbar",
          "drill",
          "hammer",
          "mallet",
          "screwdriver",
          "wrench",
          "golf_ball",
          "wheelbarrow",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "scorpion":
      if (["golf_ball"].includes(currStim)) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    case "sombra":
      if (
        [
          "boxing_gloves",
          "ice_skate",
          "shuttlecock",
          "skateboard",
          "soccerball",
          "chainsaw",
          "crowbar",
          "drill",
          "hammer",
          "mallet",
          "screwdriver",
          "wrench",
          "golf_ball",
        ].includes(currStim)
      ) {
        return responseMappings.larger;
      } else {
        return responseMappings.smaller;
      }

    default:
      console.log(currTarget);
      throw new Error("Invalid target: " + currTarget + ", " + currStim);
  }
};

/* ************************************ */
/* Define experimental variables */
/* ************************************ */

// Generic Task Variables
// Extract response mappings from assignedCondition

//const assignedCondition = {
//  internal_color: "#D41159",
//  external_color: "#1A85FF",
//  response_mapping: "index:smaller, middle:larger",
//};

const responseMappings = assignedCondition.response_mapping
  .split(", ")
  .reduce((acc, mapping) => {
    const [finger, meaning] = mapping.split(":"); // Map 'index' and 'middle' to 'smaller' or 'larger'
    acc[meaning] = finger === "index" ? "," : "."; // Ensure fixed keys for fingers
    return acc;
  }, {});

const internalColor = assignedCondition.internal_color;
const externalColor = assignedCondition.external_color;

console.log("Internal Color:", internalColor); // Should log the correct value
console.log("External Color:", externalColor); // Should log the correct value
console.log("Response Mappings:", responseMappings); // Should log {smaller: ',', larger: '.'}

// Add mappings and color assignments to jsPsych data
jsPsych.data.addProperties({
  response_mappings: {
    smaller_key: responseMappings.smaller,
    larger_key: responseMappings.larger,
  },
  cue_colors: {
    internal: internalColor,
    external: externalColor,
  },
});

var expID = "internal_external_switching_task";
var expStage = "practice";
var runPractice2 = false; // Global flag to control whether Practice 2 runs

const choices = [responseMappings.smaller, responseMappings.larger];

// Toggle Attention Checks
var runAttentionChecks = false;

// Threshold Parameters
var sumInstructTime = 0; // ms
var instructTimeThresh = 5; // in seconds
var accuracyThresh = 0.75;
var practiceAccuracyThresh = 0.75; //
var rtThresh = 1000;
var missedResponseThresh = 0.1;
var practiceThresh = 3;

// Task Length Parameters
var practiceLen = 8;
var numTestBlocks = 2;
var numTrialsPerBlock = 24; // should be multiple of 24
var testLen = numTestBlocks * numTrialsPerBlock;

// Trial Timing Paramters
const stimStimulusDuration = 1500;
const stimTrialDuration = 2000;
const encodingPhaseDuration = 1250;
const memorandaDuration = 500;
const fixationDuration = 500;
var CTI = 500;

// Trial Stimulus Variables
var lastTask = "na"; // object that holds the last task, set by setStims()
var currCue = "na"; // object that holds the current cue, set by setStims()
var currStim = "na"; // object that holds the current stim, set by setStims()
var currentTrial = 0;
var trial_type = "na";

// Conditions
const conditions = [
  "switch_internal_sports",
  "switch_external_sports",
  "switch_internal_tool",
  "switch_external_tool",
  "repeat_internal_sports",
  "repeat_external_sports",
  "repeat_internal_tool",
  "repeat_external_tool",
];

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

// Image Variables
var fileTypeExtension = "png";
var preFileType = "<img class='center' src='/images/"; // Adjusted to match static file serving

// PRE LOAD IMAGES HERE
var pathSource = "/images/";
//var pathSource =
//  "/Users/jahrios/Documents/Duke/egnerlab/projects/internal_external_switching/code/internal_external_switching_exp/experiment/images/";
var trialExamplePath = pathSource + "trial_example/trial_example.png";

var tool_objects = [
  //"axe",
  "chainsaw",
  //"chisel",
  "crowbar",
  "drill",
  //"electric_saw",
  "hammer",
  //"hand_saw",
  //"hoe",
  "mallet",
  "screwdriver",
  //"scythe",
  //"shear",
  //"shovel",
  //"sickle",
  "wrench",
  "wheelbarrow",
];

var sports_objects = [
  //"baseball_bat",
  //"basketball",
  //"bicycle",
  //"bowling_ball",
  "boxing_gloves",
  "canoe",
  //"football",
  "golf_ball",
  //"hockey_stick",
  "ice_skate",
  //"raquet",
  "shuttlecock",
  "skateboard",
  //"ski",
  "soccerball",
  "surfboard",
];

var animate_objects = [
  "ant",
  //"elephant",
  "bear",
  //"bluebird",
  "buffalo",
  "butterfly",
  //"horse",
  "caterpillar",
  //"cockroach",
  //"giraffe",
  "gorilla",
  //"rhinoceros",
  //"rabbit",
  "scorpion",
  //"seahorse",
  "sombra",
];

// Copies of the original object arrays to track remaining objects
let remainingToolObjects = [...tool_objects];
let remainingSportsObjects = [...sports_objects];
let remainingAnimateObjects = [...animate_objects];

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
    <p class="block-text">Thanks for completing this task!</p>
    <p class="block-text">Press <i>enter</i> to continue.</p>
  </div>
`;

var speedReminder = `
  <p class="block-text">
    Try to respond as quickly and accurately as possible.
  </p>
`;

const responseKeys = `
  <p class='block-text'>
    Press the <b>${responseMappings.larger}</b> if the target is <b>larger</b> 
    and the <b>${responseMappings.smaller}</b> if the target is <b>smaller</b> 
    than the referent object.
  </p>
`;

var currStim = "";

var feedbackInstructText = `
  <p class="block-text">
    Welcome! This experiment will take around 45 minutes.
  </p>
  <p class="block-text">
    To avoid technical issues, please keep the experiment tab (on Chrome or Firefox) active and in fullscreen mode for the whole duration of each task.
  </p>
  <p class="block-text"> Press <i>enter</i> to begin.</p>
`;

var feedbackText =
  "<div class = centerbox><p class = block-text>Press <i>enter</i> to begin practice.</p></div>";

var promptTextList = `
  <div style="text-align:center; font-size:calc(.7em + 0.3vw); margin-bottom: 10px; line-height: 1.5;">
    <p>
      Press <b>${
        responseMappings.smaller === ","
          ? "comma key (,)"
          : responseMappings.smaller === "."
          ? "period key (.)"
          : "Error: Mapping Missing"
      }</b> if the target is <b>smaller</b> and 
      <b>${
        responseMappings.larger === ","
          ? "comma key (,)"
          : responseMappings.larger === "."
          ? "period key (.)"
          : "Error: Mapping Missing"
      }</b> if the target is <b>larger</b>.
    </p>
  </div>
  <div style="text-align:center; margin-top:10px;">
    <p>
      <span style="font-size: 1.5em; color: ${internalColor};">+</span>
      indicates memory (<b>internal item</b>).
    </p>
    <p>
      <span style="font-size: 1.5em; color: ${externalColor};">+</span>
      indicates perception (<b>external item</b>).
    </p>
  </div>
`;

const promptText = `
  <div style="
    position: fixed;
    top: 5%; 
    left: 5%; 
    text-align: left; 
    font-size: calc(.7em + 0.3vw); 
    line-height: 1.3;
    max-width: 40%;
    z-index: 1000;">
    <p><b>${
      responseMappings.smaller === ","
        ? "comma key (,)"
        : responseMappings.smaller === "."
        ? "period key (.)"
        : "Error: Mapping Missing"
    }</b> if <b>smaller</b> and 
    <b>${
      responseMappings.larger === ","
        ? "comma key (,)"
        : responseMappings.larger === "."
        ? "period key (.)"
        : "Error: Mapping Missing"
    }</b> if <b>larger</b>.<br> 
    <span style="font-size: 1.5em; color: ${internalColor};">+</span> indicates memory (internal item) and 
    <span style="font-size: 1.5em; color: ${externalColor};">+</span> indicates perception (external item).
    </p>
  </div>
`;

var pageInstruct = [
  `
  <div class="centerbox">
    <p class="block-text">During each trial of this task, you will first see one object image presented by itself, which you have to keep in memory. This is followed by a colored fixation cross (<span style="font-size: 1.5em; color: ${externalColor};">+</span> or <span style="font-size: 1.5em; color: ${internalColor};">+</span>), and then by two object images shown side-by-side. Your task will be to judge whether one of the objects shown side-by-side (the &ldquo;target&rdquo;, shown with a black frame around it) is larger or smaller than one of the other two objects (&ldquo;reference items&rdquo;). In some trials, you will have to compare the target to the object you are holding in memory; in other trials, you will have to compare the target to the object shown next to it on the screen. Which object you need to compare the target to will be indicated by the color ( <span style="font-size: 1.5em; color: ${externalColor};">+</span> or <span style="font-size: 1.5em; color: ${internalColor};">+</span>) of the fixation cross shown on the screen between the memory object and the target screen.</p>
    
    <div class="center-image">
      <img src="${trialExamplePath}" alt="Memory Object">
    </div>

    <p class="block-text">Place your right-hand index finger on the <b>comma key (,)</b> and your right-hand middle finger on the <b>period key (.)</b></p>

    <p class="block-text">If the cue is <span style="font-size: 1.5 em; color: ${internalColor};">+</span> then compare the target to the reference item held in memory (internal item). If the cue is <span style="font-size: 24px; color: ${externalColor};">+</span> then compare the target to the reference item shown alongside it on the screen (external item).</p>

  </div>
  `,
  `
    <div class="center-image">
      <img src="${trialExamplePath}" alt="Memory Object">
    </div>

  <div class="centerbox">
    <p class="block-text">Again your task will be to judge whether the target is smaller or larger than the cued reference item. The finger mappings are shown below:</p>
    ${promptTextList}

    <p class="block-text"> Looking at the example trial above, the <span style="font-size: 1.5em; color: #1A85FF;">+</span> cue indicates that on this trial you would need to compare the target to the ${
      internalColor === "#1A85FF" ? "internal item" : "external item"
    }. Because the target (<i>leopard</i>) is larger than the ${
    internalColor === "#1A85FF" ? "internal item" : "external item"
  } (<i>${
    internalColor === "#1A85FF" ? "tennis ball" : "drill"
  }</i>), you would press the <b>${
    responseMappings?.larger === ","
      ? "<b>comma key (,)</b>"
      : responseMappings?.larger === "."
      ? "<b>period key (.)</b>"
      : "Error: Mapping Missing"
  }</b> key.
  </p>
  <p class="block-text">We'll start with a practice round. During practice, you will receive feedback and a reminder of the rules. These will be taken out for the test, so make sure you understand the instructions before moving on.</p>
    ${speedReminder}
  </div>
  `,
];

let testTrialsData = [];
let practiceTrials2Data = [];

var { trials: practiceTrials1Data, conditionCounts } =
  generateBalancedTrialsFixed(practiceLen);

// functions to check proportions //
const conditionCountsFixed = practiceTrials1Data.reduce((counts, trial) => {
  if (trial.trial_type !== "na") {
    counts[trial.trial_type] = (counts[trial.trial_type] || 0) + 1;
  }
  return counts;
}, {});

const isBalanced = Object.values(conditionCountsFixed).every(
  (count) => count === Math.floor(practiceLen / conditions.length)
);

console.log("\nGenerated Trials:");
practiceTrials1Data.forEach((trial, index) => {
  console.log(`Trial ${index + 1}:`, trial);
});

console.log("\nCondition Counts (Fixed):");
Object.entries(conditionCountsFixed).forEach(([condition, count]) => {
  console.log(`${condition}: ${count}`);
});

if (!isBalanced) {
  console.error("Conditions are not balanced!", conditionCountsFixed);
} else {
  console.log("\nValidation successful: Conditions are balanced.");
}

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

var practiceTrials1 = [];
for (var i = 0; i < practiceLen + 1; i++) {
  var setStimsBlock = {
    type: jsPsychCallFunction,
    data: {
      trial_id: "set_stims",
      trial_duration: null,
    },
    func: ((trialIndex) => () => {
      console.log(`Setting trial: ${trialIndex + 1}`);
      setStims(practiceTrials1Data[trialIndex]);
    })(i), // Use an immediately invoked function to bind the correct trial index
  };
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
          min: 0.5,
          max: 0.5,
          mean: 0.5,
        },
        block_num: stage === "practice" ? practiceCount : testCount,
        exp_stage: stage,
      };
    },

    trial_duration: function () {
      ITIms = 500;
      return ITIms;
    },
    prompt: function () {
      return getExpStage() === "practice" ? promptText : "";
    },
    on_finish: function (data) {
      data["trial_duration"] = 500;
      data["stimulus_duration"] = 500;
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

  practiceTrials1.push(
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
var practiceNode1 = {
  timeline: [feedbackBlock].concat(practiceTrials1),
  loop_function: function (data) {
    practiceCount += 1;
    currentTrial = 0;

    console.log(`Block ${practiceCount}`);

    console.log(data.trials);

    var sumRT = 0;
    var sumResponses = 0;
    var correct = 0;
    var totalTrials = 0;

    for (var i = 0; i < data.trials.length; i++) {
      if (
        data.trials[i].trial_id == "practice_trial" &&
        data.trials[i].block_num == getCurrBlockNum() - 1
      ) {
        console.log(data.trials[i]);
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

    console.log("correct: " + correct);
    console.log("totalTrials: " + totalTrials);
    console.log("sumResponses: " + sumResponses);

    var accuracy = correct / totalTrials;
    var missedResponses = (totalTrials - sumResponses) / totalTrials;
    var avgRT = sumRT / sumResponses;

    // Save performance metrics globally
    jsPsych.data.addProperties({
      practicePerformance: {
        accuracy: accuracy,
        avgRT: avgRT,
        missedResponses: missedResponses,
      },
    });

    if (accuracy >= practiceAccuracyThresh) {
      feedbackText = `
        <div class="centerbox">
          <p class="block-text">We will now begin the testing phase. During this phase, you will not see feedback during each trial, but you will be given feedback and reminders of the rules after each block (collection of trials). Below is a summary of the instructions shown earlier. Please take your time to read them and when you are ready to begin, you can press continue to start the test phase!</p>
          <p class="block-text">During this task, you will be presented with a reference item (internal) to commit to memory followed by a colored cue, then a target indicated by a black frame and a second reference item (external). Your task is to compare the size of the target and the reference item indicated by the cue.</p>
          <p class="block-text">
              <b>${
                responseMappings.larger === ","
                  ? "comma key (,)"
                  : responseMappings.larger === "."
                  ? "period key (.)"
                  : "Error: Mapping Missing"
              }</b> if <b>the target is larger</b>, and 
              <b>${
                responseMappings.smaller === ","
                  ? "comma key (,)"
                  : responseMappings.smaller === "."
                  ? "period key (.)"
                  : "Error: Mapping Missing"
              }</b> if <b>the target is smaller</b> than the cued reference item.
          </p>
          <p class="block-text">If the cue is <span style="font-size: 1.5em; color: ${internalColor};">+</span>, then compare the target to the item held in memory (internal item).</p>
          <p class="block-text">If the cue is <span style="font-size: 1.5em; color: ${externalColor};">+</span>, then compare the target to the item shown alongside it on the screen (external item).</p>
          <p class="block-text">Please remember to respond as quickly and accurately as possible as soon as you are presented with the target on the screen.</p>
          <p class="block-text">Press <b>enter</b> to start the test phase.</p>
        </div>
      `;

      // Generate test trials for the testing phase
      ({ trials: testTrialsData, conditionCounts: testConditionCounts } =
        generateBalancedTrialsFixed(numTrialsPerBlock));

      console.log("Generated test trials:", testTrialsData);

      // functions to check proportions //
      const conditionCountsFixed = testTrialsData.reduce((counts, trial) => {
        if (trial.trial_type !== "na") {
          counts[trial.trial_type] = (counts[trial.trial_type] || 0) + 1;
        }
        return counts;
      }, {});

      const isBalanced = Object.values(conditionCountsFixed).every(
        (count) => count === Math.floor(numTrialsPerBlock / conditions.length)
      );

      console.log("\nGenerated Trials:");
      testTrialsData.forEach((trial, index) => {
        console.log(`Trial ${index + 1}:`, trial);
      });

      console.log("\nCondition Counts (Fixed):");
      Object.entries(conditionCountsFixed).forEach(([condition, count]) => {
        console.log(`${condition}: ${count}`);
      });

      if (!isBalanced) {
        console.error("Conditions are not balanced!", conditionCountsFixed);
      } else {
        console.log("\nValidation successful: Conditions are balanced.");
      }

      expStage = "test";

      runPractice2 = false;
    } else {
      console.log("practice1 moving into 2!");
      feedbackText =
        "<div class = centerbox><p class = block-text>Please take this time to read your feedback! This screen will advance automatically in 1 minute.</p>";

      feedbackText +=
        '<p class=block-text>Time remaining: <span id="countdown-timer">60</span> seconds</p>';

      // Add a timer script to update the countdown
      setTimeout(() => {
        let countdown = 60; // Countdown time in seconds
        const timerElement = document.getElementById("countdown-timer");

        // Update the countdown every second
        const intervalId = setInterval(() => {
          countdown -= 1;
          if (timerElement) {
            timerElement.textContent = countdown;
          }

          // Clear the interval when the countdown reaches zero
          if (countdown <= 0) {
            clearInterval(intervalId);
          }
        }, 1000);
      }, 0);

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

      ({ trials: practiceTrials2Data, conditionCounts: testConditionCounts } =
        generateBalancedTrialsFixed(practiceLen));

      // functions to check proportions //
      const conditionCountsFixed = practiceTrials2Data.reduce(
        (counts, trial) => {
          if (trial.trial_type !== "na") {
            counts[trial.trial_type] = (counts[trial.trial_type] || 0) + 1;
          }
          return counts;
        },
        {}
      );

      const isBalanced = Object.values(conditionCountsFixed).every(
        (count) => count === Math.floor(practiceLen / conditions.length)
      );

      console.log("\nGenerated Trials:");
      practiceTrials2Data.forEach((trial, index) => {
        console.log(`Trial ${index + 1}:`, trial);
      });

      console.log("\nCondition Counts (Fixed):");
      Object.entries(conditionCountsFixed).forEach(([condition, count]) => {
        console.log(`${condition}: ${count}`);
      });

      if (!isBalanced) {
        console.error("Conditions are not balanced!", conditionCountsFixed);
      } else {
        console.log("\nValidation successful: Conditions are balanced.");
      }

      runPractice2 = true;
    }

    console.log("Practice 1 Performance:", {
      accuracy,
      avgRT,
      missedResponses,
    });

    console.log("moving on");
    return false;
  },
};

var practiceTrials2 = [];
for (var i = 0; i < practiceLen + 1; i++) {
  var setStimsBlock = {
    type: jsPsychCallFunction,
    data: {
      trial_id: "set_stims",
      trial_duration: null,
    },
    func: ((trialIndex) => () => {
      setStims(practiceTrials2Data[trialIndex]);
    })(i),
  };
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
          min: 0.5,
          max: 0.5,
          mean: 0.5,
        },
        block_num: stage === "practice" ? practiceCount : testCount,
        exp_stage: stage,
      };
    },

    trial_duration: function () {
      ITIms = 500;
      return ITIms;
    },
    prompt: function () {
      return getExpStage() === "practice" ? promptText : "";
    },
    on_finish: function (data) {
      data["trial_duration"] = 500;
      data["stimulus_duration"] = 500;
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

  practiceTrials2.push(
    setStimsBlock,
    practiceFixationBlock,
    practiceEncodigBlock,
    practiceCueBlock,
    practiceTrial,
    practiceFeedbackBlock,
    ITIBlock
  );
}

var practiceNode2 = {
  timeline: [feedbackBlock].concat(practiceTrials2),
  loop_function: function (data) {
    practiceCount += 1;
    currentTrial = 0;

    console.log("finished prcatice 2!");
    console.log("practiceCount: " + practiceCount);

    var sumRT = 0;
    var sumResponses = 0;
    var correct = 0;
    var totalTrials = 0;

    for (var i = 0; i < data.trials.length; i++) {
      if (
        data.trials[i].trial_id == "practice_trial" &&
        data.trials[i].block_num == getCurrBlockNum() - 1
      ) {
        console.log(data.trials[i]);
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

    console.log("correct: " + correct);
    console.log("totalTrials: " + totalTrials);
    console.log("sumResponses: " + sumResponses);

    var accuracy = correct / totalTrials;
    var missedResponses = (totalTrials - sumResponses) / totalTrials;
    var avgRT = sumRT / sumResponses;

    jsPsych.data.addProperties({
      practiceNode2Performance: {
        accuracy: accuracy,
        avgRT: avgRT,
        missedResponses: missedResponses,
      },
    });

    console.log("Updated Performance:", {
      accuracy: accuracy,
      avgRT: avgRT,
      missedResponses: missedResponses,
    });

    if (
      accuracy >= practiceAccuracyThresh ||
      practiceCount === practiceThresh
    ) {
      feedbackText = `
        <div class="centerbox">
          <p class="block-text">We will now begin the testing phase. During this phase, you will not see feedback during each trial, but you will be given feedback and reminders of the rules after each block (collection of trials). Below is a summary of the instructions shown earlier. Please take your time to read them and when you are ready to begin, you can press continue to start the test phase!</p>
          <p class="block-text">During this task, you will be presented with a reference item (internal) to commit to memory followed by a colored cue, then a target indicated by a black frame and a second reference item (external). Your task is to compare the size of the target and the reference item indicated by the cue.</p>
          <p class="block-text">
              <b>${
                responseMappings.larger === ","
                  ? "comma key (,)"
                  : responseMappings.larger === "."
                  ? "period key (.)"
                  : "Error: Mapping Missing"
              }</b> if <b>the target is larger</b>, and 
              <b>${
                responseMappings.smaller === ","
                  ? "comma key (,)"
                  : responseMappings.smaller === "."
                  ? "period key (.)"
                  : "Error: Mapping Missing"
              }</b> if <b>the target is smaller</b> than the cued reference item.
          </p>
          <p class="block-text">If the cue is <span style="font-size: 1.5 em; color: ${internalColor};">+</span>, then compare the target to the item held <span style="font-size: 1.5em; color: ${externalColor};">+</span>, then compare the target to the item shown alongside it on the screen (external item).</p>
          <p class="block-text">Please remember to respond as quickly and accurately as possible as soon as you are presented with the target on the screen.</p>
          <p class="block-text">Press <b>enter</b> to start the test phase.</p>
        </div>
      `;

      // Generate test trials for the testing phase
      ({ trials: testTrialsData, conditionCounts: testConditionCounts } =
        generateBalancedTrialsFixed(numTrialsPerBlock));

      console.log("Generated test trials:", testTrialsData);

      // functions to check proportions //
      const conditionCountsFixed = testTrialsData.reduce((counts, trial) => {
        if (trial.trial_type !== "na") {
          counts[trial.trial_type] = (counts[trial.trial_type] || 0) + 1;
        }
        return counts;
      }, {});

      const isBalanced = Object.values(conditionCountsFixed).every(
        (count) => count === Math.floor(numTrialsPerBlock / conditions.length)
      );

      console.log("\nGenerated Trials:");
      testTrialsData.forEach((trial, index) => {
        console.log(`Trial ${index + 1}:`, trial);
      });

      console.log("\nCondition Counts (Fixed):");
      Object.entries(conditionCountsFixed).forEach(([condition, count]) => {
        console.log(`${condition}: ${count}`);
      });

      if (!isBalanced) {
        console.error("Conditions are not balanced!", conditionCountsFixed);
      } else {
        console.log("\nValidation successful: Conditions are balanced.");
      }

      expStage = "test";

      runPractice2 = false;

      return false;
    } else {
      console.log("practice running again: " + practiceCount);
      feedbackText =
        "<div class = centerbox><p class = block-text>Please take this time to read your feedback! This screen will advance automatically in 1 minute.</p>";

      feedbackText +=
        '<p class=block-text>Time remaining: <span id="countdown-timer">60</span> seconds</p>';

      setTimeout(() => {
        let countdown = 60; // Countdown time in seconds
        const timerElement = document.getElementById("countdown-timer");

        if (timerElement) {
          const intervalId = setInterval(() => {
            countdown -= 1;
            timerElement.textContent = countdown;

            if (countdown <= 0) {
              clearInterval(intervalId);
            }
          }, 1000);
        } else {
          console.error("#countdown-timer not found in DOM!");
        }
      }, 0);

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

      ({ trials: practiceTrials2Data, conditionCounts: testConditionCounts } =
        generateBalancedTrialsFixed(practiceLen));

      // functions to check proportions //
      const conditionCountsFixed = practiceTrials2Data.reduce(
        (counts, trial) => {
          if (trial.trial_type !== "na") {
            counts[trial.trial_type] = (counts[trial.trial_type] || 0) + 1;
          }
          return counts;
        },
        {}
      );

      const isBalanced = Object.values(conditionCountsFixed).every(
        (count) => count === Math.floor(practiceLen / conditions.length)
      );

      console.log("\nGenerated Trials:");
      practiceTrials2Data.forEach((trial, index) => {
        console.log(`Trial ${index + 1}:`, trial);
      });

      console.log("\nCondition Counts (Fixed):");
      Object.entries(conditionCountsFixed).forEach(([condition, count]) => {
        console.log(`${condition}: ${count}`);
      });

      if (!isBalanced) {
        console.error("Conditions are not balanced!", conditionCountsFixed);
      } else {
        console.log("\nValidation successful: Conditions are balanced.");
      }

      runPractice2 = true;

      // Build new test timeline dynamically
      practiceTrials2 = [];
      for (var i = 0; i < practiceLen + 1; i++) {
        practiceTrials2.push(
          {
            type: jsPsychCallFunction,
            func: ((trialIndex) => () => {
              setStims(practiceTrials2Data[trialIndex]);
            })(i),
            data: { trial_id: "set_stims" },
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: fixation,
            choices: ["NO_KEYS"],
            data: { trial_id: "practice_fixation", block_num: practiceCount },
            trial_duration: fixationDuration,
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: getCue,
            choices: ["NO_KEYS"],
            data: { trial_id: "practice_cue", block_num: practiceCount },
            trial_duration: getCTI(),
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: getEncodingStim,
            choices: ["NO_KEYS"],
            data: { trial_id: "practice_encoding", block_num: practiceCount },
            trial_duration: encodingPhaseDuration,
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: getDecisionStim,
            choices: choices,
            data: {
              trial_id: "practice_trial",
              block_num: practiceCount,
              exp_stage: "practice",
            },
            trial_duration: stimTrialDuration,
            on_finish: appendData,
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: fixation,
            choices: ["NO_KEYS"],
            data: { trial_id: "practice_ITI", block_num: practiceCount },
            trial_duration: 500,
          }
        );
      }

      practiceNode2.timeline = [feedbackBlock].concat(practiceTrials2);

      console.log(practiceTrials2);
      console.log(runPractice2);

      return true;
    }
  },
};

var conditionalPractice2Node = {
  timeline: [practiceNode2],
  conditional_function: function () {
    console.log(runPractice2);

    return runPractice2;
  },
};

var testTrials = [];
for (var i = 0; i < numTrialsPerBlock + 1; i++) {
  var setStimsBlock = {
    type: jsPsychCallFunction,
    data: {
      trial_id: "set_stims",
      trial_duration: null,
    },
    func: ((trialIndex) => () => {
      console.log(`Setting trial: ${trialIndex + 1}`);
      setStims(testTrialsData[trialIndex]);
    })(i), // Use an immediately invoked function to bind the correct trial index
  };

  var testFixationBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: fixation,
    choices: ["NO_KEYS"],
    data: {
      trial_id: "test_fixation",
      exp_stage: "test",
      trial_duration: fixationDuration,
      stimulus_duration: fixationDuration,
    },
    stimulus_duration: fixationDuration, // 500
    trial_duration: fixationDuration, // 500
    on_finish: function (data) {
      data["block_num"] = testCount;
    },
  };

  var testCueBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: getCue,
    choices: ["NO_KEYS"],
    data: {
      trial_id: "test_cue",
      exp_stage: "test",
      trial_duration: getCTI(),
      stimulus_duration: getCTI(),
    },
    trial_duration: getCTI,
    stimulus_duration: getCTI,

    on_finish: appendData,
  };

  var testEncodigBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: getEncodingStim,
    choices: ["NO_KEYS"],
    data: {
      trial_id: "test_cue",
      exp_stage: "test",
      trial_duration: encodingPhaseDuration,
      stimulus_duration: memorandaDuration,
    },
    trial_duration: encodingPhaseDuration,
    stimulus_duration: memorandaDuration,

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
          min: 0.5,
          max: 0.5,
          mean: 0.5,
        },
        block_num: stage === "test" ? testCount : testCount,
        exp_stage: stage,
      };
    },

    trial_duration: function () {
      ITIms = 500;
      return ITIms;
    },
    on_finish: function (data) {
      data["trial_duration"] = 500;
      data["stimulus_duration"] = 500;
    },
  };

  var testTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: getDecisionStim,
    choices: choices,
    data: {
      exp_stage: "test",
      trial_id: "test_trial",
      choices: choices,
      trial_duration: stimTrialDuration,
      stimulus_duration: stimStimulusDuration,
    },

    stimulus_duration: stimStimulusDuration, // 1000
    trial_duration: stimTrialDuration, // 1500
    response_ends_trial: false,
    on_finish: appendData,
  };

  testTrials.push(
    setStimsBlock,
    testFixationBlock,
    testEncodigBlock,
    testCueBlock,
    testTrial,
    ITIBlock
  );
}

var testCount = 0;
var testNode = {
  timeline: [feedbackBlock].concat(testTrials),
  loop_function: function (data) {
    testCount += 1;
    currentTrial = 0;

    console.log("Block ${testCount} of ${numTestBlocks}");

    var sumRT = 0;
    var sumResponses = 0;
    var correct = 0;
    var totalTrials = 0;

    for (var i = 0; i < data.trials.length; i++) {
      if (
        data.trials[i].trial_id == "test_trial" &&
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

    if (testCount === numTestBlocks) {
      feedbackText = `<div class=centerbox>
        <p class=block-text>Done with this task.</p>
        <p class=centerbox>Press <i>enter</i> to continue.</p>
        </div>`;

      return false;
    } else {
      feedbackText =
        "<div class = centerbox><p class = block-text>Please take this time to read your feedback! This screen will advance automatically in 1 minute.</p>";

      feedbackText += `<p class=block-text>You have completed ${testCount} out of ${numTestBlocks} blocks of trials.</p>`;

      feedbackText +=
        '<p class=block-text>Time remaining: <span id="countdown-timer">60</span> seconds</p>';

      // Add a timer script to update the countdown
      setTimeout(() => {
        let countdown = 60; // Countdown time in seconds
        const timerElement = document.getElementById("countdown-timer");

        // Update the countdown every second
        const intervalId = setInterval(() => {
          countdown -= 1;
          if (timerElement) {
            timerElement.textContent = countdown;
          }

          // Clear the interval when the countdown reaches zero
          if (countdown <= 0) {
            clearInterval(intervalId);
          }
        }, 1000);
      }, 0);

      if (accuracy < accuracyThresh) {
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

      feedbackText += `<p class="block-text">Press <i>enter</i> to begin.</p></div>`;

      // Generate test trials for the testing phase
      ({ trials: testTrialsData, conditionCounts: testConditionCounts } =
        generateBalancedTrialsFixed(numTrialsPerBlock));
      // functions to check proportions //
      const conditionCountsFixed = testTrialsData.reduce((counts, trial) => {
        if (trial.trial_type !== "na") {
          counts[trial.trial_type] = (counts[trial.trial_type] || 0) + 1;
        }
        return counts;
      }, {});

      const isBalanced = Object.values(conditionCountsFixed).every(
        (count) => count === Math.floor(numTrialsPerBlock / conditions.length)
      );

      console.log("\nGenerated Trials:");
      testTrialsData.forEach((trial, index) => {
        console.log(`Trial ${index + 1}:`, trial);
      });

      console.log("\nCondition Counts (Fixed):");
      Object.entries(conditionCountsFixed).forEach(([condition, count]) => {
        console.log(`${condition}: ${count}`);
      });

      if (!isBalanced) {
        console.error("Conditions are not balanced!", conditionCountsFixed);
      } else {
        console.log("\nValidation successful: Conditions are balanced.");
      }

      // Build new test timeline dynamically
      testTrials = [];
      for (var i = 0; i < testTrialsData.length; i++) {
        testTrials.push(
          {
            type: jsPsychCallFunction,
            func: (() => setStims(testTrialsData[i]))(),
            data: { trial_id: "set_stims" },
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: fixation,
            choices: ["NO_KEYS"],
            data: { trial_id: "test_fixation", block_num: testCount },
            trial_duration: fixationDuration,
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: getCue,
            choices: ["NO_KEYS"],
            data: { trial_id: "test_cue", block_num: testCount },
            trial_duration: getCTI(),
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: getEncodingStim,
            choices: ["NO_KEYS"],
            data: { trial_id: "test_encoding", block_num: testCount },
            trial_duration: encodingPhaseDuration,
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: getDecisionStim,
            choices: choices,
            data: {
              trial_id: "test_trial",
              block_num: testCount,
              exp_stage: "test",
            },
            trial_duration: stimTrialDuration,
            on_finish: appendData,
          },
          {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: fixation,
            choices: ["NO_KEYS"],
            data: { trial_id: "test_ITI", block_num: testCount },
            trial_duration: 500,
          }
        );
      }

      testNode.timeline = [feedbackBlock].concat(testTrials);
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
  console.log("Response Mappings:", responseMappings);
  console.log("Assigned condition:", assignedCondition);

  jsPsych.pluginAPI.preloadImages(imageUrls);

  internal_external_experiment.push(fullscreen);
  internal_external_experiment.push(instructionNode);
  internal_external_experiment.push(practiceNode1);
  internal_external_experiment.push(conditionalPractice2Node); // Conditionally includes Practice 2
  internal_external_experiment.push(testNode);
  internal_external_experiment.push(endBlock);
  internal_external_experiment.push(exitFullscreen);
};

// Call to initialize the experiment
internal_external_experiment_init();

// Run the experiment using the initialized timeline
jsPsych.run(internal_external_experiment);
