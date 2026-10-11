import { DetailedLessonPlan } from '../types';

export const EXACT_SAMPLE_DETAILED_PLAN: DetailedLessonPlan = {
  className: "KG",
  topic: "Colors (Red, Blue, Yellow)",
  subject: "English (Literacy)",
  teacherName: "Kabir Ustadh",
  duration: "30 mins",
  materials: "Color flashcards, red/blue/yellow toys, crayons, worksheet.",
  learningObjective: "By the end of the lesson, children will be able to identify red, blue, and yellow objects by pointing and naming them.",
  successCriteria: [
    "1. Point to a yellow/red/blue object when asked",
    "2. Say the color name (red / blue / yellow) while pointing",
    "3. Match objects to the correct color group"
  ],
  procedures: [
    {
      stageAndTime: "Lead in / warm-up\n3-5 minutes",
      activityTitle: "Hello Song + Color Hunt",
      procedurePoints: [
        "Teacher sings the hello song",
        "Children look around the classroom and point to one red, one yellow and one blue object"
      ],
      childrenDo: "Point and name",
      teacherDoes: "Models and encourages.",
      intPattern: "W/C\nC / O",
      aids: "SB\nC / O"
    },
    {
      stageAndTime: "Main activity\n15-20 minutes",
      activityTitle: "Flashcard & Toy Show",
      procedurePoints: [
        "Teacher shows one color at a time",
        "Children repeat and touch matching toys"
      ],
      childrenDo: "Say color names, touch objects",
      teacherDoes: "Shows, asks simple questions",
      intPattern: "W/C\nS",
      aids: "Flashcards\n& toys"
    },
    {
      stageAndTime: "Practice / play\n10 minutes",
      activityTitle: "Color Stations",
      procedurePoints: [
        "Children move to color corners (Red / Blue / Yellow)",
        "Pick up matching objects"
      ],
      childrenDo: "Move, sort, talk",
      teacherDoes: "Monitors and praises",
      intPattern: "GW\nS",
      aids: "Objects"
    },
    {
      stageAndTime: "Review\n5 minutes",
      activityTitle: "Color Song + Exit Check",
      procedurePoints: [
        "Sing a color song with actions",
        "Each child points to one color before leaving"
      ],
      childrenDo: "Sing and show understanding",
      teacherDoes: "Checks learning informally",
      intPattern: "W/C",
      aids: "SB"
    }
  ],
  symbolKeys: {
    intKeys: [
      { symbol: "W/C", meaning: "whole class" },
      { symbol: "PW", meaning: "Pair work" },
      { symbol: "GW", meaning: "Group work" },
      { symbol: "S", meaning: "students work individually" }
    ],
    aidsKeys: [
      { symbol: "SB", meaning: "Smartboard" },
      { symbol: "TB", meaning: "Textbook" },
      { symbol: "W/S", meaning: "Worksheet" }
    ]
  }
};
