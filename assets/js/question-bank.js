(function () {
  "use strict";

  const tracks = [
    { id: "circulation", title: "Heart & circulation", icon: "HC", guidance: "Discuss persistent chest, heartbeat, fainting or swelling concerns with a clinician." },
    { id: "breathing", title: "Breathing & airways", icon: "BA", guidance: "Breathing symptoms may need examination and oxygen-level assessment." },
    { id: "metabolic", title: "Energy & blood sugar", icon: "EB", guidance: "A clinician may review glucose, thyroid, nutrition and other metabolic causes." },
    { id: "neurology", title: "Brain & nerves", icon: "BN", guidance: "New neurological symptoms need prompt professional assessment." },
    { id: "digestive", title: "Digestive health", icon: "DH", guidance: "A clinician can assess persistent pain, bowel changes, reflux or appetite loss." },
    { id: "urinary", title: "Urinary & kidney", icon: "UK", guidance: "Urinary changes may require urine testing, kidney review or examination." },
    { id: "infection", title: "Fever & infection", icon: "FI", guidance: "Persistent fever or rapid deterioration should be reviewed promptly." },
    { id: "skin", title: "Skin & allergy", icon: "SA", guidance: "A clinician can review rashes, swelling, triggers and possible allergy." },
    { id: "musculoskeletal", title: "Muscles & joints", icon: "MJ", guidance: "Persistent pain, swelling or loss of function deserves clinical review." },
    { id: "wellbeing", title: "Mood & sleep", icon: "MS", guidance: "Mood and sleep concerns are health concerns and support is available." }
  ];

  const prompts = {
    circulation: [
      "Have you had chest pressure, tightness or pain?", "Have you noticed a racing, pounding or irregular heartbeat?", "Have you felt faint or actually fainted?", "Have your ankles or legs become swollen?", "Do you become unusually tired with ordinary activity?", "Have you had pain spreading to your arm, jaw, back or shoulder?", "Do you feel breathless when lying flat?", "Have your hands or feet become unusually cold or bluish?", "Have you been told your blood pressure is repeatedly high or low?", "Is there a family history of early heart disease or sudden cardiac death?"
    ],
    breathing: [
      "Are you short of breath at rest or with light activity?", "Have you had a cough lasting more than two weeks?", "Do you wheeze or hear a whistling sound while breathing?", "Are you coughing up blood or rust-coloured material?", "Do you wake at night because you cannot breathe comfortably?", "Have you had chest pain that worsens with a deep breath?", "Have you recently had fever with cough or phlegm?", "Do dust, exercise, smoke or cold air trigger breathing trouble?", "Have you had unexplained weight loss with a persistent cough?", "Has a pulse oximeter repeatedly shown a lower-than-usual oxygen level?"
    ],
    metabolic: [
      "Are you much thirstier than usual?", "Are you passing urine more often, especially at night?", "Have you had unexplained weight loss or gain?", "Do you often feel shaky, sweaty or weak when meals are delayed?", "Are you unusually sensitive to heat or cold?", "Have you experienced persistent fatigue despite adequate rest?", "Are wounds taking longer than expected to heal?", "Have you noticed blurred vision that comes and goes?", "Have you had new tingling or burning in your feet?", "Have you previously been told that glucose, thyroid or cholesterol tests were abnormal?"
    ],
    neurology: [
      "Have you developed sudden weakness or numbness on one side?", "Have you had new trouble speaking, understanding or finding words?", "Have you experienced a new or unusually severe headache?", "Have you had a seizure, blackout or unexplained loss of awareness?", "Are you having new balance or walking difficulty?", "Have you noticed persistent numbness, tingling or burning?", "Has your memory or concentration changed enough to affect daily life?", "Have you had double vision or sudden loss of vision?", "Do you have tremor, stiffness or slowed movement?", "Have you recently had a head injury followed by worsening symptoms?"
    ],
    digestive: [
      "Have you had persistent or recurring abdominal pain?", "Have you had frequent heartburn or acid coming into your throat?", "Has your bowel pattern changed for more than two weeks?", "Have you seen blood in vomit or stool, or had black stool?", "Have you had repeated vomiting or difficulty keeping fluids down?", "Do you feel full unusually quickly or have reduced appetite?", "Have your skin or eyes appeared yellow?", "Have you had difficulty or pain when swallowing?", "Do particular foods reliably trigger pain, bloating or diarrhoea?", "Have you lost weight without trying alongside digestive symptoms?"
    ],
    urinary: [
      "Do you have pain or burning when passing urine?", "Are you passing urine more often or urgently than usual?", "Have you noticed blood, cola colour or unusual cloudiness in urine?", "Do you have pain in your side or lower back?", "Have you had fever or chills with urinary symptoms?", "Is it difficult to start urine flow or empty your bladder?", "Are your face, hands or feet newly swollen?", "Has the amount of urine become much less than usual?", "Have you developed new loss of bladder control?", "Have kidney stones, kidney disease or recurrent infections affected you before?"
    ],
    infection: [
      "Have you had a measured fever or repeated chills?", "Did your symptoms begin suddenly and worsen quickly?", "Are you confused, very drowsy or difficult to wake?", "Do you have a stiff neck with fever or severe headache?", "Do you have a new painful, red or draining wound?", "Have you had close contact with someone who was infectious?", "Have you had night sweats or unexplained prolonged fever?", "Have you recently travelled, had surgery or stayed in hospital?", "Are you immunocompromised or taking medicines that suppress immunity?", "Have you been unable to drink enough because of illness?"
    ],
    skin: [
      "Have you developed a new rash, hives or widespread itching?", "Are your lips, tongue, face or throat swelling?", "Is a red area rapidly spreading, hot or very painful?", "Have you started a new medicine, food or skin product recently?", "Are there blisters or peeling skin?", "Has a mole or skin mark changed in size, shape or colour?", "Do you have a wound or ulcer that is not healing?", "Is the rash accompanied by fever or joint pain?", "Are symptoms linked to an insect bite or sting?", "Have skin symptoms persisted despite avoiding suspected triggers?"
    ],
    musculoskeletal: [
      "Do you have joint or muscle pain that limits normal activity?", "Is a joint newly red, hot or swollen?", "Did the pain start after a fall, twist or direct injury?", "Is there back pain with new leg weakness or numbness?", "Have you lost bladder or bowel control with back pain?", "Can you put weight on or use the affected limb?", "Do you have morning stiffness lasting longer than 30 minutes?", "Do you have fever or unexplained weight loss with bone or joint pain?", "Has the pain lasted longer than six weeks?", "Have you had recurrent fractures or been told your bones are weak?"
    ],
    wellbeing: [
      "Have you felt persistently low, hopeless or unable to enjoy things?", "Have worry or panic symptoms been difficult to control?", "Are you sleeping much less or much more than usual?", "Have you had thoughts of harming yourself or not wanting to live?", "Are mood or sleep changes affecting work, study or relationships?", "Have you felt unusually energetic with very little need for sleep?", "Are alcohol or other substances being used to cope?", "Have appetite or weight changed alongside mood symptoms?", "Do you feel unsafe at home or in a relationship?", "Would you like support from a mental-health professional?"
    ]
  };

  const urgent = new Set([
    "circulation-0", "circulation-2", "circulation-5", "breathing-0", "breathing-3",
    "neurology-0", "neurology-1", "neurology-3", "neurology-7", "digestive-3",
    "urinary-7", "infection-2", "infection-3", "skin-1", "skin-4",
    "musculoskeletal-4", "wellbeing-3", "wellbeing-8"
  ]);
  const urgentOnAnyPositive = new Set(["wellbeing-3", "wellbeing-8"]);
  const urgentOnYes = new Set(["breathing-3", "neurology-0", "neurology-1", "neurology-3", "neurology-7", "digestive-3", "infection-2", "infection-3", "skin-1", "musculoskeletal-4"]);
  const options = [
    { label: "No", detail: "Not present", score: 0 },
    { label: "A little", detail: "Mild or occasional", score: 1 },
    { label: "Yes", detail: "Recurring or affecting daily life", score: 2 },
    { label: "Severe / now", detail: "New, severe or rapidly worsening", score: 3 }
  ];

  const questions = [];
  for (let round = 0; round < 10; round += 1) {
    tracks.forEach((track) => {
      questions.push({
        id: `${track.id}-${round}`,
        track: track.id,
        prompt: prompts[track.id][round],
        options,
        urgentThreshold: urgentOnAnyPositive.has(`${track.id}-${round}`) ? 1 : urgentOnYes.has(`${track.id}-${round}`) ? 2 : urgent.has(`${track.id}-${round}`) ? 3 : null
      });
    });
  }

  window.ONE_PLAN_QUESTION_BANK = { tracks, questions, maximumAsked: 50, checkpoints: [10, 20, 30, 40, 50] };
})();
