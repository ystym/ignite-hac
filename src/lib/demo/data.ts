import type {
  ExtractionResult,
  NotesContent,
  QuizContent,
  ReliabilityRunResult,
} from "@/lib/schemas";

/* -------------------------------------------------------------------------- */
/* Handwritten physics notes                                                  */
/* -------------------------------------------------------------------------- */

export const handwrittenExtraction: ExtractionResult = {
  title: "Kinematics — handwritten physics notes",
  detectedLanguage: "English",
  overallConfidence: 0.76,
  blocks: [
    {
      id: "hw-1",
      type: "heading",
      text: "PHYSICS — KINEMATICS",
      page: 1,
      confidence: 0.93,
      uncertain: false,
    },
    {
      id: "hw-2",
      type: "heading",
      text: "Motion in a straight line (Ch. 3)",
      page: 1,
      confidence: 0.91,
      uncertain: false,
    },
    {
      id: "hw-3",
      type: "list",
      text: "Motion = change of position with time. Rest and motion are relative; the frame of reference matters.",
      page: 1,
      confidence: 0.9,
      uncertain: false,
    },
    {
      id: "hw-4",
      type: "list",
      text: "Distance: total path length (scalar). Displacement: shortest vector from start to end.",
      page: 1,
      confidence: 0.89,
      uncertain: false,
    },
    {
      id: "hw-5",
      type: "formula",
      text: "Speed = distance / time",
      page: 1,
      confidence: 0.94,
      uncertain: false,
    },
    {
      id: "hw-6",
      type: "formula",
      text: "Velocity = displacement / time (vector)",
      page: 1,
      confidence: 0.92,
      uncertain: false,
    },
    {
      id: "hw-7",
      type: "paragraph",
      text: "Uniform motion means equal displacement in equal time intervals.",
      page: 1,
      confidence: 0.84,
      uncertain: false,
    },
    {
      id: "hw-8",
      type: "formula",
      text: "Acceleration a = dv / dt",
      page: 1,
      confidence: 0.87,
      uncertain: false,
    },
    {
      id: "hw-9",
      type: "paragraph",
      text: "For constant acceleration only:",
      page: 1,
      confidence: 0.91,
      uncertain: false,
    },
    {
      id: "hw-10",
      type: "formula",
      text: "v = u + a·t",
      page: 1,
      confidence: 0.94,
      uncertain: false,
    },
    {
      id: "hw-11",
      type: "formula",
      text: "s = u·t + ½ a t²",
      page: 1,
      confidence: 0.63,
      uncertain: true,
      note: "The exponent is overwritten. It was read as t² from context, but the original pixels do not confirm this.",
    },
    {
      id: "hw-12",
      type: "formula",
      text: "v² = u² + 2·a·s",
      page: 1,
      confidence: 0.92,
      uncertain: false,
    },
    {
      id: "hw-13",
      type: "paragraph",
      text: "Graph: slope of x–t = velocity.",
      page: 1,
      confidence: 0.89,
      uncertain: false,
    },
    {
      id: "hw-14",
      type: "paragraph",
      text: "On a v–t graph, slope = acceleration and area under the line = displacement.",
      page: 1,
      confidence: 0.88,
      uncertain: false,
    },
    {
      id: "hw-15",
      type: "diagram",
      text: "v–t graph with a straight rising line. Vertical axis labelled v, horizontal axis labelled t; slope label reads 'slope = a'. The right edge of the graph is cropped.",
      page: 1,
      confidence: 0.54,
      uncertain: true,
      note: "Axis values and the full time interval are not visible; do not infer numerical values from this diagram.",
    },
    {
      id: "hw-16",
      type: "unreadable",
      text: "?? smudged: ½ a t^2 or ½ a t^3 ?",
      page: 1,
      confidence: 0.28,
      uncertain: true,
      note: "The exponent is overwritten with the same ink as the integral-like symbol. A specific digit cannot be recovered.",
    },
    {
      id: "hw-17",
      type: "paragraph",
      text: "Sign convention: upward (+), downward (−).",
      page: 1,
      confidence: 0.87,
      uncertain: false,
    },
    {
      id: "hw-18",
      type: "paragraph",
      text: "Revise relative velocity and river-boat problems.",
      page: 1,
      confidence: 0.9,
      uncertain: false,
    },
  ],
  warnings: [
    {
      message:
        "The exponent in the second equation of motion is smudged; it may be t² or t³. It is flagged uncertain and must be checked against a clean source.",
      severity: "critical",
      location: "Page 1 · equations of motion",
    },
    {
      message:
        "The right side of the v–t graph is cropped, so its time interval and axis values cannot be read. No numerical values were inferred.",
      severity: "warning",
      location: "Page 1 · diagram",
    },
    {
      message:
        "Two words in the heading overlap a ruled line. Both readings are supported by visible letter shapes.",
      severity: "info",
      location: "Page 1 · title",
    },
    {
      message:
        "Handwriting varies in thickness and lighting. These confidence values are model-reported and not calibrated probabilities.",
      severity: "info",
    },
  ],
};

export const handwrittenNotes: NotesContent = {
  title: "Kinematics: motion in a straight line",
  overview:
    "This chapter explains how position, displacement, speed, velocity and acceleration describe one-dimensional motion. It also covers the three equations that apply only when acceleration is constant, and how to read motion graphs. One formula in the source is smudged, so it is treated as uncertain rather than memorised blindly.",
  sections: [
    {
      heading: "1. Frame of reference, distance and displacement",
      explanation:
        "Motion is a change of position with time. It only makes sense relative to a frame of reference — the object or point you measure from. Distance is a scalar: the total path you actually travel. Displacement is a vector: the straight line from the starting point to the ending point, including direction. They are equal only when motion is in one direction without turning back.",
      keyPoints: [
        "Distance depends on the path taken; displacement depends only on the start and end points.",
        "Displacement has both magnitude and direction; distance has magnitude only.",
        "A full lap around a track has non-zero distance but zero displacement because start and end coincide.",
      ],
      definitions: [
        { term: "Scalar", definition: "A quantity with magnitude but no direction." },
        { term: "Vector", definition: "A quantity with both magnitude and direction." },
        {
          term: "Frame of reference",
          definition: "The coordinate system and observer relative to which position and motion are measured.",
        },
      ],
      formulas: [],
      examples: [
        "Walk 30 m east, then 20 m west. Distance travelled = 50 m. Displacement = 10 m east, because the final position is 10 m east of the start.",
      ],
      examTips: [
        "State the direction whenever you write a displacement or velocity.",
        "Do not write 'displacement = 10 m' without specifying east/west or a sign convention.",
      ],
    },
    {
      heading: "2. Speed and velocity",
      explanation:
        "Speed is distance divided by time. Velocity is displacement divided by time and is a vector. Average speed uses total distance; average velocity uses total displacement. This distinction is why a runner who returns to the start can have high average speed but zero average velocity.",
      keyPoints: [
        "Speed = distance / time.",
        "Velocity = displacement / time, with direction.",
        "Average velocity can be zero even when average speed is not.",
      ],
      definitions: [
        { term: "Speed", definition: "Rate of covering distance; a scalar." },
        { term: "Velocity", definition: "Rate of change of displacement; a vector." },
        {
          term: "Uniform motion",
          definition: "Motion in which equal displacements occur in equal time intervals, so velocity is constant.",
        },
      ],
      formulas: [
        { formula: "\\text{Speed} = \\dfrac{\\text{distance}}{\\text{time}}", explanation: "Always non-negative because distance is non-negative." },
        { formula: "\\vec{v} = \\dfrac{\\Delta \\vec{x}}{\\Delta t}", explanation: "Average velocity is displacement divided by the time interval." },
      ],
      examples: [
        "A bus covers 120 m in 20 s. Its average speed is 6 m/s. If it moved in a straight line, its average velocity is also 6 m/s in that direction.",
      ],
      examTips: [
        "Check whether the question gives distance or displacement before choosing speed or velocity.",
        "A change of direction changes velocity even if the speed stays constant.",
      ],
    },
    {
      heading: "3. Acceleration and the equations of motion",
      explanation:
        "Acceleration is the rate of change of velocity, a = dv/dt. When acceleration is constant, the three standard equations connect initial velocity u, final velocity v, displacement s, acceleration a and time t. The source's second equation has a smudged exponent: standard kinematics uses s = ut + ½at², but the photo itself is not clear enough to verify the exponent. Treat that one line as unverified.",
      keyPoints: [
        "The three equations apply only for constant acceleration.",
        "List known and unknown quantities before choosing an equation.",
        "The photographed exponent on the second equation is uncertain; verify it with a clean textbook before memorising.",
      ],
      definitions: [
        {
          term: "Acceleration",
          definition: "Rate of change of velocity with respect to time; a vector.",
        },
        {
          term: "Initial velocity (u)",
          definition: "Velocity at the start of the chosen time interval.",
        },
      ],
      formulas: [
        { formula: "a = \\dfrac{dv}{dt}", explanation: "Instantaneous acceleration is the derivative of velocity." },
        { formula: "v = u + at", explanation: "Final velocity after time t at constant acceleration." },
        { formula: "s = ut + \\tfrac{1}{2}at^2", explanation: "Standard constant-acceleration displacement formula. The exponent in the source photo is smudged and flagged uncertain." },
        { formula: "v^2 = u^2 + 2as", explanation: "Useful when time is not given." },
      ],
      examples: [
        "A ball starts from rest and accelerates at 2 m/s² for 4 s. Using v = u + at gives v = 0 + 2(4) = 8 m/s. The displacement is s = 0 + ½(2)(4²) = 16 m.",
      ],
      examTips: [
        "Write the condition 'constant acceleration' before using the three equations.",
        "If acceleration is not constant, use calculus or a graph, not the constant-acceleration equations.",
        "Do not silently copy the smudged formula from these notes — verify its exponent.",
      ],
    },
    {
      heading: "4. Reading motion graphs",
      explanation:
        "On a position–time (x–t) graph, the slope is velocity. On a velocity–time (v–t) graph, the slope is acceleration and the area under the line is displacement. The handwritten graph in the source is cropped on the right, so its axis values and full time interval cannot be read. The qualitative slope relationship is readable, but no numerical conclusions should be drawn.",
      keyPoints: [
        "Slope of x–t = velocity.",
        "Slope of v–t = acceleration.",
        "Area under v–t = displacement.",
        "The source graph's right edge is cropped, so only qualitative reading is safe.",
      ],
      definitions: [
        { term: "Slope", definition: "Change in the vertical quantity divided by change in the horizontal quantity." },
        {
          term: "Area under a graph",
          definition: "The signed area between the plotted line and the horizontal axis; its physical meaning depends on the graph.",
        },
      ],
      formulas: [
        { formula: "v = \\dfrac{dx}{dt}", explanation: "The slope of an x–t graph is velocity." },
      ],
      examples: [
        "A straight, rising v–t line means constant positive acceleration. The area between the line and the time axis equals displacement.",
      ],
      examTips: [
        "Label axes and units before reading a graph.",
        "For a curved v–t graph, acceleration changes; you cannot use the three constant-acceleration equations.",
        "If a graph is cropped, state that the missing values cannot be determined.",
      ],
    },
    {
      heading: "5. The smudged formula: an honest gap",
      explanation:
        "The source contains a deliberately unclear line: it could read ½at² or ½at³. The visible pixels do not settle the exponent. The correct study action is to mark the line as uncertain and verify it with a clean source, not to pick one because it 'looks right'. The standard equation s = ut + ½at² is used in the explanation above, with that caveat attached.",
      keyPoints: [
        "The original exponent is not verifiable from the photo.",
        "Do not memorise an uncertain formula as if it were confirmed.",
        "Use the human-correction workflow to fix it when a clean source is available.",
      ],
      definitions: [],
      formulas: [
        { formula: "\\text{uncertain: } s = ut + \\tfrac{1}{2}at^? \\quad (2 \\text{ or } 3?)", explanation: "The exponent is the unresolved part; do not treat this as a verified formula." },
      ],
      examples: [
        "If you write t³ instead of t², the dimensions no longer match displacement: ½at³ has units m·s, not m. Dimensional analysis can flag the error, but it is still not proof of what was written.",
      ],
      examTips: [
        "Use dimensional analysis as a sanity check, then verify against the textbook.",
        "In an exam, state the standard constant-acceleration equation; do not rely on the unclear photo.",
      ],
    },
  ],
  keyTakeaways: [
    "Distance is a scalar path length; displacement is a directed straight-line change in position.",
    "Speed uses distance; velocity uses displacement and has direction.",
    "Acceleration is the rate of change of velocity, a = dv/dt.",
    "The three constant-acceleration equations fail when acceleration changes.",
    "Graph slopes and areas encode physical quantities: x–t slope is velocity; v–t slope is acceleration; v–t area is displacement.",
    "One formula exponent in the source is genuinely unreadable and must be verified, not guessed.",
  ],
  importantExamPoints: [
    "Explain why displacement can be zero while distance is non-zero.",
    "Derive or apply v = u + at, s = ut + ½at² and v² = u² + 2as for constant acceleration.",
    "State the constant-acceleration condition before using those equations.",
    "Interpret the slope and area of position–time and velocity–time graphs.",
    "Use a sign convention and keep directions consistent.",
    "Describe relative velocity and river-boat problems qualitatively.",
    "Identify when a graph is cropped or a reading is uncertain, and say so.",
  ],
  uncertainAreas: [
    {
      topic: "s = ut + ½at² exponent",
      reason:
        "The handwritten exponent is overwritten and could be 2 or 3. The standard physics formula suggests 2, but the source itself cannot confirm it.",
    },
    {
      topic: "v–t graph numbers",
      reason:
        "The right side of the diagram is cropped; axis values and the complete time interval are not visible.",
    },
  ],
};

export const handwrittenQuiz: QuizContent = {
  title: "Kinematics — grounded practice quiz",
  difficulty: "mixed",
  questions: [
    {
      id: "q1",
      question: "Which statement best distinguishes distance from displacement?",
      options: [
        "Distance is a vector, while displacement is a scalar.",
        "Distance is the total path length, while displacement is the shortest vector from start to end.",
        "Distance is always smaller than displacement.",
        "Distance depends only on the final position, while displacement depends on the path.",
      ],
      correctIndex: 1,
      explanation:
        "The source defines distance as total path length (scalar) and displacement as the shortest vector from start to end. Distance can be equal to or larger than the magnitude of displacement, never smaller.",
      difficulty: "easy",
      concept: "Distance vs displacement",
      sourceExcerpt: "Distance: total path length (scalar). Displacement: shortest vector from start to end.",
    },
    {
      id: "q2",
      question:
        "A student walks 30 m east and then 20 m west. What are the distance travelled and the magnitude of displacement?",
      options: [
        "Distance = 10 m; displacement = 50 m",
        "Distance = 50 m; displacement = 10 m",
        "Distance = 50 m; displacement = 50 m",
        "Distance = 10 m; displacement = 10 m",
      ],
      correctIndex: 1,
      explanation:
        "Distance is the total path length: 30 + 20 = 50 m. Displacement is the final position relative to the start: 30 − 20 = 10 m east. This follows the source's distinction between path length and the start-to-end vector.",
      difficulty: "medium",
      concept: "Distance vs displacement",
      sourceExcerpt: "Distance: total path length (scalar). Displacement: shortest vector from start to end.",
    },
    {
      id: "q3",
      question: "On a velocity–time graph, what does the area under the line represent?",
      options: ["Acceleration", "Displacement", "Speed", "Force"],
      correctIndex: 1,
      explanation:
        "The source states that on a v–t graph, slope = acceleration and area under the line = displacement. Area has the dimensions of velocity × time, which is displacement.",
      difficulty: "easy",
      concept: "Motion graphs",
      sourceExcerpt: "On a v–t graph, slope = acceleration and area under the line = displacement.",
    },
    {
      id: "q4",
      question: "What does the slope of a position–time (x–t) graph represent?",
      options: ["Displacement", "Acceleration", "Velocity", "Total distance"],
      correctIndex: 2,
      explanation:
        "The source states: 'Graph: slope of x–t = velocity.' Slope is change in position divided by change in time, which is velocity.",
      difficulty: "easy",
      concept: "Motion graphs",
      sourceExcerpt: "Graph: slope of x–t = velocity.",
    },
    {
      id: "q5",
      question: "Which condition is required before using v = u + at?",
      options: [
        "The object must start from rest.",
        "The acceleration must be constant.",
        "The motion must be vertical.",
        "The distance must be zero.",
      ],
      correctIndex: 1,
      explanation:
        "The source explicitly labels the three equations as applying 'for constant acceleration only'. Starting from rest is a special case, not a requirement, and direction is handled by sign convention.",
      difficulty: "medium",
      concept: "Equations of motion",
      sourceExcerpt: "For constant acceleration only: v = u + a·t",
    },
    {
      id: "q6",
      question:
        "The photographed equation has an exponent that could be t² or t³. What is the most responsible study action?",
      options: [
        "Memorise t³ because it appears more often in the sketch.",
        "Choose whichever exponent makes the answer shorter.",
        "Flag it as uncertain, verify with a clean source, and correct the note manually.",
        "Ignore the equation entirely and never revise it.",
      ],
      correctIndex: 2,
      explanation:
        "The app flagged the exponent as unreadable because the pixels do not support a definite reading. Guessing would create a false fact. Verify with a clean textbook and use the manual-correction workflow. The standard form is s = ut + ½at², but that must be checked against the source, not assumed.",
      difficulty: "hard",
      concept: "Handling uncertain extraction",
      sourceExcerpt: "?? smudged: ½ a t^2 or ½ a t^3 ?",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Syllabus PDF                                                               */
/* -------------------------------------------------------------------------- */

export const syllabusExtraction: ExtractionResult = {
  title: "CS204 · Data Structures & Algorithms — Semester 4 syllabus",
  detectedLanguage: "English (assumed from script)",
  overallConfidence: 0.99,
  blocks: [
    {
      id: "dsa-1",
      type: "heading",
      text: "CS204 · DATA STRUCTURES & ALGORITHMS",
      page: 1,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-2",
      type: "paragraph",
      text: "Semester 4 syllabus and study material · 4 credits · 2026–27. End-semester examination: 18 December 2026. The exam is closed-book, 3 hours, and covers all five modules. Internal assessment includes two coding assignments and one mid-semester test.",
      page: 1,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-3",
      type: "heading",
      text: "Course outcomes",
      page: 1,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-4",
      type: "list",
      text: "CO1 — Analyse time and space complexity using asymptotic notation. CO2 — Implement arrays, linked lists, stacks and queues. CO3 — Traverse and modify trees and graphs. CO4 — Apply hashing, sorting and dynamic programming. CO5 — Reason about correctness, trade-offs and edge cases.",
      page: 1,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-5",
      type: "heading",
      text: "Module 1 · Arrays, Strings, and Complexity",
      page: 2,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-6",
      type: "paragraph",
      text: "An array is a contiguous block of memory storing elements of the same type. Element i is accessed at address = base + i × element_size in O(1). Insertion or deletion in the middle is O(n) due to shifting. A dynamic array doubles capacity when full, giving amortised O(1) append. Strings are often immutable, so concatenating in a loop can cost O(n²). Important patterns are two pointers, sliding window, prefix sums and frequency arrays.",
      page: 2,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-7",
      type: "paragraph",
      text: "Asymptotic analysis: Big-O is an upper bound, Big-Omega a lower bound, Big-Theta a tight bound. Drop constants and lower-order terms: 3n² + 5n + 9 is Θ(n²). Growth order: O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), O(n!). Master theorem: for T(n) = aT(n/b) + f(n), compare f(n) with n^(log_b a).",
      page: 2,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-8",
      type: "example",
      text: "Kadane's algorithm finds the largest contiguous subarray sum in O(n) time and O(1) space: current = max(a[i], current + a[i]); best = max(best, current). Brute force checks O(n²) subarrays.",
      page: 2,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-9",
      type: "heading",
      text: "Module 2 · Linked Lists, Stacks, and Queues",
      page: 2,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-10",
      type: "paragraph",
      text: "A singly linked list node stores a value and a next pointer. Head insertion is O(1), search is O(n), and deleting a known node is O(1) with its predecessor. A doubly linked list also stores a previous pointer, enabling O(1) deletion with only the node reference. Linked lists avoid shifting but lose random access and have pointer overhead plus poor cache locality.",
      page: 2,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-11",
      type: "diagram",
      text: "Linked list diagram: head → 12 → 7 → 24 → null. Each node stores data and a pointer to the next node. Access is sequential: O(n).",
      page: 2,
      confidence: 0.99,
      uncertain: false,
      note: "Diagram caption transcribed from the PDF text layer; the visual layout itself was not interpreted.",
    },
    {
      id: "dsa-12",
      type: "paragraph",
      text: "A stack is LIFO with O(1) push and pop; applications include expression evaluation, balanced parentheses, undo and iterative DFS. A queue is FIFO with enqueue at the rear and dequeue from the front. A circular array queue avoids O(n) shifts. A deque supports both ends in O(1). A monotonic stack finds the next greater element in O(n).",
      page: 2,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-13",
      type: "example",
      text: "Exam-style question: design a queue using two stacks and state the amortised cost. Answer: keep input and output stacks; push is O(1). To dequeue, if output is empty, move all items from input to output, then pop. Each element moves at most once, so amortised dequeue is O(1), although one dequeue can be O(n).",
      page: 2,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-14",
      type: "heading",
      text: "Module 3 · Trees, Heaps, and Balanced Search Trees",
      page: 3,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-15",
      type: "paragraph",
      text: "A binary tree has at most two children per node. DFS traversals: preorder (node, left, right), inorder (left, node, right), postorder (left, right, node). In a binary search tree, every left value is smaller and every right value is larger, so inorder traversal is sorted. Search, insert and delete are O(h): O(log n) balanced, O(n) worst case.",
      page: 3,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-16",
      type: "diagram",
      text: "Binary search tree diagram with root 50, left 30 (children 20, 40) and right 70 (children 60, 80). Inorder traversal is 20, 30, 40, 50, 60, 70, 80.",
      page: 3,
      confidence: 0.99,
      uncertain: false,
      note: "Tree labels and caption transcribed from the PDF text layer.",
    },
    {
      id: "dsa-17",
      type: "paragraph",
      text: "A binary heap is a complete tree stored in an array: children of index i are 2i+1 and 2i+2. A min-heap keeps the smallest key at the root. Insert and extract-min are O(log n); peek is O(1); building a heap bottom-up is O(n). Heap sort is O(n log n) time and O(1) extra array space. Priority queues are used in Dijkstra's algorithm and task schedulers. AVL trees keep balance factors in {-1, 0, 1}; red-black trees guarantee O(log n) height. B-trees store many keys per node for databases and file systems.",
      page: 3,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-18",
      type: "heading",
      text: "Module 4 · Graphs",
      page: 3,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-19",
      type: "paragraph",
      text: "Graphs can be stored as an adjacency list O(V+E) or adjacency matrix O(V²). BFS uses a queue and finds shortest paths in unweighted graphs. DFS uses recursion or a stack and supports cycle detection, topological sorting and connected components. Mark visited nodes to avoid infinite loops. Dijkstra requires non-negative weights and costs O((V+E) log V) with a priority queue. Bellman-Ford handles negative edges in O(VE) and detects negative cycles. Kruskal's MST sorts edges and uses union-find; Prim's grows a tree from a start vertex. Topological sort is defined only for a DAG.",
      page: 3,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-20",
      type: "heading",
      text: "Module 5 · Hashing, Sorting, and Searching",
      page: 4,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-21",
      type: "paragraph",
      text: "A hash function maps a key to an index. A collision occurs when two keys map to the same index. Chaining stores a list per bucket; open addressing probes for the next free slot. With a good hash and load factor below 1, average lookup is O(1); worst case O(n). Load factor = entries / buckets. Rehashing restores a low load factor. Bubble, insertion and selection sort are O(n²). Merge sort is stable, O(n log n), with O(n) extra space. Quicksort is O(n log n) average and O(n²) worst case; randomised pivots reduce risk. Heapsort is O(n log n) in place but not stable. Comparison sorting has a lower bound of Ω(n log n). Counting and radix sort can beat this for small integer or fixed-length keys.",
      page: 4,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-22",
      type: "paragraph",
      text: "Binary search requires a sorted array. Compare the target with the middle element and discard half the range; complexity O(log n). Use mid = low + (high - low) // 2 to avoid overflow. The harder part is the invariant for first-true or last-true variants.",
      page: 4,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-23",
      type: "heading",
      text: "Module 6 · Dynamic Programming and Greedy Methods",
      page: 4,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-24",
      type: "paragraph",
      text: "Dynamic programming applies when a problem has overlapping subproblems and optimal substructure. Define the state, transition, base case and answer extraction. Memoisation caches recursive results; tabulation fills iteratively and can save memory. Classic problems: 0/1 knapsack, longest common subsequence, edit distance, coin change and matrix chain multiplication. A greedy algorithm makes the locally best choice and never reconsiders; it is correct only with the greedy-choice property and optimal substructure. Activity selection and Huffman coding are greedy. Greedy coin change fails for coins {1, 3, 4} and target 6.",
      page: 4,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-25",
      type: "heading",
      text: "Assessment and revision guidance",
      page: 5,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-26",
      type: "paragraph",
      text: "Internal assessment: 30%; end-semester examination: 70%. The written exam contains short-answer questions, complexity derivations, tracing questions, and one design question. Code is not executed; pseudocode with clear invariants and edge cases is expected. Assessment weights: mid-semester test 15%; coding assignment 1 7.5%; coding assignment 2 7.5%; end-semester exam 70%.",
      page: 5,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-27",
      type: "list",
      text: "High-yield exam points: state complexity in terms of n, V and E and say average or worst case. For every algorithm, mention the invariant and one edge case (empty input, one element, duplicates, disconnected graph). Know stable vs in-place sorting with examples. Compare adjacency list and matrix for sparse and dense graphs. For DP, write the recurrence before code. Simulate a small example by hand.",
      page: 5,
      confidence: 0.99,
      uncertain: false,
    },
    {
      id: "dsa-28",
      type: "paragraph",
      text: "Revision plan suggestion: spend 40% of available time on weak modules, 30% on active recall and past questions, 20% on timed practice and 10% on a final error log. Revisit mistakes after 24 hours and after one week.",
      page: 5,
      confidence: 0.99,
      uncertain: false,
    },
  ],
  warnings: [
    {
      message:
        "Text was extracted directly from the PDF's digital text layer with unpdf/PDF.js — not OCR. Reading order and diagram layout can differ from the visual page.",
      severity: "info",
    },
    {
      message:
        "The linked-list and binary-search-tree diagrams were transcribed from their digital labels; the system did not make a technical inference from the drawing.",
      severity: "warning",
      location: "Pages 2–3 · diagrams",
    },
  ],
};

export const syllabusNotes: NotesContent = {
  title: "Data Structures & Algorithms — exam-ready notes",
  overview:
    "This syllabus organises the course around six practical areas: array/string complexity, linear structures, trees and heaps, graphs, hashing/sorting/searching, and dynamic programming. The highest-value skill in the written exam is explaining trade-offs, stating complexity precisely, and handling edge cases — not just naming algorithms.",
  sections: [
    {
      heading: "1. Arrays, strings and asymptotic analysis",
      explanation:
        "An array stores elements contiguously, so index access is O(1) using address = base + i × element_size. Middle insertion or deletion shifts elements and costs O(n). A dynamic array doubles capacity when full; individual appends can be O(n), but the amortised cost is O(1). Strings are often immutable, so repeated concatenation in a loop may create a new string each time and cost O(n²). Use two pointers, sliding windows, prefix sums and frequency arrays for common string problems. For growth, drop constants and lower-order terms: 3n² + 5n + 9 is Θ(n²).",
      keyPoints: [
        "Array index access: O(1). Middle insert/delete: O(n).",
        "Dynamic array append: amortised O(1), worst case O(n) when resizing.",
        "Big-O is an upper bound, Big-Omega a lower bound, Big-Theta a tight bound.",
        "Growth order: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!).",
      ],
      definitions: [
        { term: "Amortised cost", definition: "Total cost of a sequence of operations divided across those operations; a rare expensive resize can average out to O(1) per append." },
        { term: "Asymptotic notation", definition: "A way to describe how running time or space grows as input size grows, ignoring constants and lower-order terms." },
        { term: "Sliding window", definition: "A technique that maintains a contiguous range and updates it incrementally instead of recomputing from scratch." },
      ],
      formulas: [
        { formula: "\\text{address}(i) = \\text{base} + i \\times \\text{element\\_size}", explanation: "Random access formula for a zero-indexed contiguous array." },
        { formula: "T(n) = aT(n/b) + f(n)", explanation: "Master theorem form; compare f(n) with n^(log_b a) to find the growth class." },
        { formula: "3n^2 + 5n + 9 = \\Theta(n^2)", explanation: "Constants and lower-order terms are dropped in asymptotic analysis." },
      ],
      examples: [
        "Kadane's algorithm solves maximum contiguous subarray sum in O(n) time and O(1) space: current = max(a[i], current + a[i]); best = max(best, current). Brute force checks every subarray in O(n²).",
      ],
      examTips: [
        "State whether the complexity is worst case, average case, or amortised.",
        "For a dynamic array, do not claim every append is worst-case O(1).",
      ],
    },
    {
      heading: "2. Linked lists, stacks and queues",
      explanation:
        "A linked list stores values in nodes connected by pointers. Head insertion is O(1), search is O(n), and deletion of a known node is O(1) if you have its predecessor. Doubly linked lists add a previous pointer so a known node can be deleted in O(1) without searching for its predecessor. They trade random access and cache locality for cheap insertion. Stacks are LIFO; queues are FIFO. Both support O(1) core operations when implemented well. A monotonic stack solves next-greater-element problems in O(n).",
      keyPoints: [
        "Linked list search is O(n); head insert is O(1).",
        "Stack = LIFO; queue = FIFO; deque supports both ends.",
        "Two stacks can implement a queue with amortised O(1) dequeue.",
        "Circular array queues avoid O(n) shifting.",
      ],
      definitions: [
        { term: "LIFO", definition: "Last in, first out — the most recently added item is removed first (stack)." },
        { term: "FIFO", definition: "First in, first out — the earliest added item is removed first (queue)." },
        { term: "Amortised O(1)", definition: "Some operations may be expensive, but the average over a long sequence is constant." },
      ],
      formulas: [],
      examples: [
        "Queue with two stacks: push onto the input stack. To dequeue, if the output stack is empty, move all items from input to output, then pop. Each item moves at most once, so dequeue is amortised O(1).",
      ],
      examTips: [
        "For the two-stack queue, explain both the single-operation worst case and the amortised cost.",
        "Name one edge case: dequeuing from an empty queue.",
      ],
    },
    {
      heading: "3. Trees, heaps and balanced trees",
      explanation:
        "Binary trees have at most two children. Inorder traversal of a binary search tree visits values in sorted order. BST search, insert, and delete cost O(h); a balanced tree gives h = O(log n), while a degenerate tree gives O(n). A complete binary tree can be stored in an array, which is how heaps work. In a min-heap the root is the minimum; insert and extract-min are O(log n), heap construction is O(n), and heap sort is O(n log n) in place. AVL trees maintain balance factors of −1, 0 or 1. Red-black trees use a looser balance guarantee but still O(log n) height. B-trees fan out to minimise disk I/O.",
      keyPoints: [
        "Inorder BST traversal → sorted order.",
        "BST operations are O(h), not automatically O(log n).",
        "Heap insert/extract-min: O(log n); peek O(1); build-heap O(n).",
        "Heap sort: O(n log n) time, O(1) extra array space, not stable.",
        "AVL and red-black trees guarantee O(log n) height; B-trees target disk access.",
      ],
      definitions: [
        { term: "BST property", definition: "For every node, all values in its left subtree are smaller and all values in its right subtree are larger." },
        { term: "Complete binary tree", definition: "Every level is filled except possibly the last, which is filled from left to right." },
        { term: "Balance factor", definition: "Height of left subtree minus height of right subtree; AVL keeps it in {−1, 0, 1}." },
      ],
      formulas: [
        { formula: "\\text{children}(i) = 2i+1,\\; 2i+2", explanation: "Array indices of a binary heap's children for a zero-based array." },
        { formula: "\\text{BST cost} = O(h)", explanation: "Height h is O(log n) when balanced and O(n) when degenerate." },
      ],
      examples: [
        "Insert 50, 30, 70, 20, 40, 60, 80 into an empty BST. Inorder traversal is 20, 30, 40, 50, 60, 70, 80, which is sorted.",
      ],
      examTips: [
        "Do not say a BST is always O(log n); qualify it with 'balanced'.",
        "Remember that a heap is not fully sorted; only the root-to-child ordering is guaranteed.",
      ],
    },
    {
      heading: "4. Graph representations and algorithms",
      explanation:
        "Adjacency lists use O(V+E) space and are good for sparse graphs; adjacency matrices use O(V²) but allow O(1) edge lookup. BFS uses a queue and finds shortest paths when every edge has equal weight. DFS uses a stack or recursion and supports cycle detection, connected components and topological ordering. Dijkstra works only with non-negative edge weights and uses a priority queue for O((V+E) log V). Bellman-Ford handles negative weights and can detect negative cycles. Kruskal sorts edges and checks cycle creation with union-find; Prim grows a tree from a starting vertex. Topological sort exists only for DAGs.",
      keyPoints: [
        "Adjacency list O(V+E); matrix O(V²); choose based on sparsity.",
        "BFS → shortest path in an unweighted graph; DFS → structure and cycles.",
        "Dijkstra requires non-negative weights; Bellman-Ford tolerates negative edges.",
        "Kruskal = sort edges + union-find; Prim = grow a tree.",
        "Always mark visited vertices.",
      ],
      definitions: [
        { term: "DAG", definition: "Directed acyclic graph; no directed cycle exists." },
        { term: "Minimum spanning tree", definition: "A set of edges connecting all vertices with minimum total weight and no cycles." },
        { term: "Topological order", definition: "A linear ordering of a DAG where every edge points from earlier to later." },
      ],
      formulas: [
        { formula: "\\text{Dijkstra} = O((V+E)\\log V)", explanation: "With a binary heap priority queue and non-negative weights." },
        { formula: "\\text{Bellman-Ford} = O(VE)", explanation: "Relax all edges V−1 times; a further relaxation indicates a negative cycle." },
      ],
      examples: [
        "A road network with non-negative distances is a good fit for Dijkstra. If some edges can have negative cost (for example, a rebate), Dijkstra may fail; use Bellman-Ford instead.",
      ],
      examTips: [
        "Say why Dijkstra fails with a negative edge — a settled distance may later be improved.",
        "For MST questions, state whether the graph is connected and weighted.",
      ],
    },
    {
      heading: "5. Hashing, sorting and searching",
      explanation:
        "A hash table maps keys to buckets. Collisions are resolved with chaining or open addressing. Average lookup is O(1) when the hash is good and the load factor is low; worst case is O(n) because all keys can collide. Load factor = entries / buckets. Rehashing reduces the load factor. Comparison sorting cannot beat Ω(n log n). Merge sort is stable and O(n log n) with O(n) extra space; quicksort is average O(n log n) but worst-case O(n²), reduced by random pivots; heapsort is in-place and O(n log n) but unstable. Counting and radix sort can beat the comparison bound for restricted keys. Binary search is O(log n) but requires a sorted array.",
      keyPoints: [
        "Average hash lookup O(1), worst case O(n).",
        "Merge sort: stable, O(n log n), O(n) extra space.",
        "Quicksort: average O(n log n), worst O(n²); randomise pivots.",
        "Heapsort: O(n log n), in place, not stable.",
        "Comparison sorting lower bound: Ω(n log n).",
        "Binary search requires sorted input and a correct invariant.",
      ],
      definitions: [
        { term: "Load factor", definition: "Number of stored entries divided by the number of buckets." },
        { term: "Stable sort", definition: "Equal keys retain their relative input order." },
        { term: "In-place sort", definition: "Uses only O(1) or O(log n) auxiliary space beyond the input." },
      ],
      formulas: [
        { formula: "\\text{load factor} = \\dfrac{\\text{entries}}{\\text{buckets}}", explanation: "A low load factor usually reduces collisions but increases memory use." },
        { formula: "\\text{mid} = \\text{low} + \\lfloor(\\text{high}-\\text{low})/2\\rfloor", explanation: "Overflow-safe midpoint calculation for binary search." },
      ],
      examples: [
        "A {1, 3, 4} coin system with target 6: greedy picks 4 + 1 + 1 (three coins), but 3 + 3 is optimal. This is a coin example, but the same greedy-failure reasoning matters in DP selection.",
      ],
      examTips: [
        "Be ready to compare stable, in-place, and adaptive sorts with examples.",
        "Explain why hash worst case is O(n), even though average is O(1).",
      ],
    },
    {
      heading: "6. Dynamic programming and greedy methods",
      explanation:
        "Dynamic programming requires overlapping subproblems and optimal substructure. Define the state, transition, base case, and how to extract the answer. Memoisation is top-down; tabulation is bottom-up and can often reduce memory. Example states: knapsack capacity and item index; LCS prefix lengths; edit-distance prefixes; coin-change amount. Greedy algorithms make one local choice and never revisit it. They are correct only with the greedy-choice property and optimal substructure. Activity selection and Huffman coding are greedy; coin change is not always.",
      keyPoints: [
        "DP = overlapping subproblems + optimal substructure.",
        "Write state → transition → base case → answer.",
        "Memoisation caches recursion; tabulation fills a table iteratively.",
        "Greedy is not automatically optimal; test it against counterexamples.",
        "Classic problems: knapsack, LCS, edit distance, coin change, matrix chain.",
      ],
      definitions: [
        { term: "Optimal substructure", definition: "An optimal solution contains optimal solutions to subproblems." },
        { term: "Overlapping subproblems", definition: "The same smaller subproblems are solved repeatedly." },
        { term: "Greedy-choice property", definition: "A locally optimal choice can be part of a globally optimal solution." },
      ],
      formulas: [
        { formula: "dp[i] = \\max(dp[i-1],\\; dp[i-2] + value[i])", explanation: "A generic recurrence shape for choose-or-skip problems; the exact indices depend on the problem." },
      ],
      examples: [
        "0/1 knapsack: dp[i][w] = max(dp[i−1][w], value[i] + dp[i−1][w−weight[i]]) when weight[i] ≤ w; otherwise use dp[i−1][w].",
      ],
      examTips: [
        "Explain the state in words before writing a recurrence.",
        "Give a counterexample when asked why greedy fails.",
      ],
    },
  ],
  keyTakeaways: [
    "Asymptotic analysis is about growth, not exact operation counts.",
    "Choose data structures by operation mix, memory and cache behaviour.",
    "BST performance depends on height; balanced trees keep it logarithmic.",
    "Graph algorithms have preconditions: Dijkstra needs non-negative weights; topological sort needs a DAG.",
    "Hash tables average O(1), but adversarial collisions degrade to O(n).",
    "Dynamic programming needs a correct state and recurrence; greedy needs a proof.",
  ],
  importantExamPoints: [
    "Derive and state the complexity of each algorithm, including average vs worst case.",
    "Explain the two-stack queue and its amortised cost.",
    "Trace BFS, DFS, Dijkstra and binary search on a small example.",
    "Compare merge sort, quicksort and heapsort on stability, space and worst case.",
    "State why greedy coin change fails for {1, 3, 4} and target 6.",
    "Write the 0/1 knapsack recurrence and base case.",
    "Describe when to use adjacency list vs matrix.",
    "Give a correctness invariant and one edge case for every algorithm you discuss.",
  ],
  uncertainAreas: [
    {
      topic: "Diagram interpretation",
      reason:
        "The PDF contains linked-list and BST diagrams. Their labels were read from the text layer, but the system did not infer anything beyond those labels.",
    },
  ],
};

export const syllabusQuiz: QuizContent = {
  title: "DSA syllabus — grounded practice quiz",
  difficulty: "mixed",
  questions: [
    {
      id: "q1",
      question: "Why is random access to an array element O(1)?",
      options: [
        "Because the array is always sorted.",
        "Because the element address can be computed from the base address and index.",
        "Because a linked list stores a pointer to every index.",
        "Because insertion shifts all elements.",
      ],
      correctIndex: 1,
      explanation:
        "The source gives address = base + i × element_size. That arithmetic takes constant time. Sorting and insertion are unrelated to random access.",
      difficulty: "easy",
      concept: "Array complexity",
      sourceExcerpt: "Element i is accessed at address = base + i × element_size in O(1).",
    },
    {
      id: "q2",
      question: "A queue is implemented with two stacks. What is the amortised cost of dequeue?",
      options: ["O(1)", "O(log n)", "O(n²)", "O(V+E)"],
      correctIndex: 0,
      explanation:
        "Each element is moved from the input stack to the output stack at most once. A single dequeue can be O(n), but across a sequence the amortised cost is O(1).",
      difficulty: "medium",
      concept: "Queue with two stacks",
      sourceExcerpt:
        "Each element moves at most once, so amortised dequeue is O(1), although one dequeue can be O(n).",
    },
    {
      id: "q3",
      question: "Which traversal of a binary search tree produces sorted order?",
      options: ["Preorder", "Inorder", "Postorder", "Breadth-first"],
      correctIndex: 1,
      explanation:
        "Inorder visits left subtree, node, right subtree. The BST property makes this sorted. Preorder and postorder do not.",
      difficulty: "easy",
      concept: "BST traversals",
      sourceExcerpt: "In a binary search tree, every left value is smaller and every right value is larger, so inorder traversal is sorted.",
    },
    {
      id: "q4",
      question: "Which condition is required for Dijkstra's algorithm to be valid?",
      options: [
        "The graph must be a tree.",
        "All edge weights must be non-negative.",
        "The graph must be unweighted.",
        "The graph must be complete.",
      ],
      correctIndex: 1,
      explanation:
        "Dijkstra settles the closest unfinished vertex; a later negative edge could improve an already-settled distance, so non-negative weights are required. BFS handles unweighted graphs; completeness is not required.",
      difficulty: "medium",
      concept: "Shortest paths",
      sourceExcerpt:
        "Dijkstra requires non-negative weights and costs O((V+E) log V) with a priority queue.",
    },
    {
      id: "q5",
      question: "Which statement about merge sort is correct?",
      options: [
        "It is in-place and unstable.",
        "It is stable and uses O(n) auxiliary space.",
        "It has O(n²) worst-case time.",
        "It requires a binary search tree.",
      ],
      correctIndex: 1,
      explanation:
        "The source states merge sort is stable, O(n log n), and uses O(n) auxiliary space. Heapsort is the in-place sort; quicksort has the O(n²) worst case.",
      difficulty: "easy",
      concept: "Sorting comparison",
      sourceExcerpt: "Merge sort is stable, O(n log n), and uses O(n) extra space.",
    },
    {
      id: "q6",
      question: "For coins {1, 3, 4} and target 6, why does greedy fail?",
      options: [
        "Greedy always finds the optimal answer for every coin system.",
        "Greedy picks 4 + 1 + 1 (three coins), while 3 + 3 uses two.",
        "The target is impossible to make.",
        "Only dynamic programming can add numbers.",
      ],
      correctIndex: 1,
      explanation:
        "The source explicitly uses {1, 3, 4} with target 6 as a greedy counterexample. Choosing the largest coin first is locally optimal but blocks the better 3 + 3 solution.",
      difficulty: "medium",
      concept: "Greedy vs DP",
      sourceExcerpt: "Greedy coin change fails for coins {1, 3, 4} and target 6.",
    },
    {
      id: "q7",
      question: "What does a load factor below 1 usually indicate in a hash table?",
      options: [
        "The table has more entries than buckets.",
        "The table has fewer entries than buckets, usually reducing collisions.",
        "All keys are guaranteed unique.",
        "Lookup is guaranteed O(1) in the worst case.",
      ],
      correctIndex: 1,
      explanation:
        "Load factor = entries / buckets. Below 1 means fewer entries than buckets. It tends to reduce collisions, but does not guarantee worst-case O(1); a bad hash can still collide.",
      difficulty: "medium",
      concept: "Hashing",
      sourceExcerpt: "Load factor = entries / buckets. Rehashing restores a low load factor.",
    },
    {
      id: "q8",
      question: "Which pair of properties is required for dynamic programming to apply?",
      options: [
        "A sorted input and a hash table.",
        "Overlapping subproblems and optimal substructure.",
        "A DAG and non-negative weights.",
        "A stable sort and O(1) space.",
      ],
      correctIndex: 1,
      explanation:
        "The source defines DP by overlapping subproblems and optimal substructure. A DAG and non-negative weights belong to graph algorithms; sorting is unrelated.",
      difficulty: "easy",
      concept: "Dynamic programming",
      sourceExcerpt: "Dynamic programming applies when a problem has overlapping subproblems and optimal substructure.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Audio lecture                                                              */
/* -------------------------------------------------------------------------- */

export const audioExtraction: ExtractionResult = {
  title: "Kinematics lecture — noisy recording",
  detectedLanguage: "English",
  overallConfidence: 0.72,
  blocks: [
    {
      id: "au-1",
      type: "heading",
      text: "Chapter 3 — motion in a straight line (lecture)",
      startSeconds: 0,
      endSeconds: 8,
      confidence: 0.95,
      uncertain: false,
    },
    {
      id: "au-2",
      type: "paragraph",
      text: "Distance is total path length and displacement is the straight-line vector from start to end. Displacement can be zero even when distance is not zero.",
      startSeconds: 9,
      endSeconds: 29,
      confidence: 0.91,
      uncertain: false,
    },
    {
      id: "au-3",
      type: "paragraph",
      text: "Speed equals distance divided by time. Velocity equals displacement divided by time and has direction. Uniform acceleration means velocity changes at a constant rate.",
      startSeconds: 30,
      endSeconds: 51,
      confidence: 0.88,
      uncertain: false,
    },
    {
      id: "au-4",
      type: "formula",
      text: "v = u + a t",
      startSeconds: 52,
      endSeconds: 58,
      confidence: 0.9,
      uncertain: false,
    },
    {
      id: "au-5",
      type: "formula",
      text: "s = u t + ½ a t²",
      startSeconds: 59,
      endSeconds: 67,
      confidence: 0.61,
      uncertain: true,
      note: "The lecturer corrects the exponent near the end of the recording, but the correction is partly masked by hum.",
    },
    {
      id: "au-6",
      type: "formula",
      text: "v² = u² + 2 a s",
      startSeconds: 68,
      endSeconds: 75,
      confidence: 0.87,
      uncertain: false,
    },
    {
      id: "au-7",
      type: "paragraph",
      text: "On a velocity–time graph, slope is acceleration and area under the line is displacement. If the graph is curved, acceleration is not constant, so do not use the three equations.",
      startSeconds: 76,
      endSeconds: 98,
      confidence: 0.84,
      uncertain: false,
    },
    {
      id: "au-8",
      type: "paragraph",
      text: "For relative velocity in the same direction, subtract the velocities. For river-boat problems, resolve boat and river velocities as perpendicular vectors.",
      startSeconds: 99,
      endSeconds: 115,
      confidence: 0.79,
      uncertain: false,
    },
    {
      id: "au-9",
      type: "paragraph",
      text: "Correction: the exponent is t squared, not t cubed. Check the board before copying. [partly masked by background hum]",
      startSeconds: 116,
      endSeconds: 130,
      confidence: 0.58,
      uncertain: true,
      note: "The correction is audible but the word after 't' is partly masked. It sounds like 'squared', but this is flagged for verification.",
    },
    {
      id: "au-10",
      type: "paragraph",
      text: "Focus on graph interpretation and relative velocity. Next class starts projectile motion.",
      startSeconds: 131,
      endSeconds: 146,
      confidence: 0.86,
      uncertain: false,
    },
  ],
  warnings: [
    {
      message:
        "The recording is quiet and has a constant low-frequency hum. Several words are less clear than the transcript's high-confidence sections.",
      severity: "warning",
      location: "Full recording",
    },
    {
      message:
        "The lecturer's correction of the exponent at about 01:56 is partly masked. The transcript flags it and does not treat it as verified.",
      severity: "critical",
      location: "Audio 01:56–02:10",
    },
    {
      message:
        "Timestamps are approximate and were returned by the audio model. They should not be used as exact word timings.",
      severity: "info",
    },
  ],
};

export const audioNotes: NotesContent = {
  title: "Kinematics lecture notes — from a noisy recording",
  overview:
    "This lecture reviews one-dimensional motion: distance vs displacement, speed vs velocity, constant acceleration equations, velocity–time graphs and relative velocity. The recording is noisy, and the lecturer's correction of one exponent is partly masked. That point is flagged instead of being presented as verified.",
  sections: [
    {
      heading: "1. Distance, displacement, speed and velocity",
      explanation:
        "Distance is the total path length; displacement is the straight-line vector from the start to the end. A round trip can have non-zero distance and zero displacement. Speed = distance / time. Velocity = displacement / time and includes direction. Uniform acceleration means the velocity changes at a constant rate.",
      keyPoints: [
        "Distance is scalar; displacement is a vector.",
        "Displacement can be zero while distance is non-zero.",
        "Speed uses distance; velocity uses displacement.",
      ],
      definitions: [
        { term: "Displacement", definition: "The straight-line vector from the starting point to the ending point." },
        { term: "Uniform acceleration", definition: "Acceleration that stays constant in magnitude and direction during the motion." },
      ],
      formulas: [
        { formula: "\\text{Speed} = \\dfrac{\\text{distance}}{\\text{time}}", explanation: "A scalar rate." },
        { formula: "\\vec{v} = \\dfrac{\\Delta\\vec{x}}{\\Delta t}", explanation: "Average velocity is a vector." },
      ],
      examples: [
        "A student walks 10 m away and 10 m back: distance = 20 m, displacement = 0 m.",
      ],
      examTips: [
        "Mention direction whenever you state a displacement or velocity.",
        "Do not use 'speed' and 'velocity' interchangeably in a written answer.",
      ],
    },
    {
      heading: "2. Constant-acceleration equations",
      explanation:
        "The three standard equations apply only when acceleration is constant: v = u + at; s = ut + ½at²; v² = u² + 2as. The lecture audio contains a correction of the exponent in the second equation, but the correction is partly masked by hum. The transcript flags the line as uncertain; verify it against the board or a clean textbook before relying on it.",
      keyPoints: [
        "The equations require constant acceleration.",
        "u is initial velocity, v final velocity, s displacement, a acceleration, t time.",
        "The audio's exponent correction is not fully audible; do not treat it as verified.",
      ],
      definitions: [
        { term: "Initial velocity", definition: "Velocity at the beginning of the chosen interval." },
        { term: "Displacement", definition: "Change in position, including direction." },
      ],
      formulas: [
        { formula: "v = u + at", explanation: "Final velocity after time t at constant acceleration." },
        { formula: "s = ut + \\tfrac{1}{2}at^2", explanation: "Standard form. The recorded correction is partly masked; flagged uncertain." },
        { formula: "v^2 = u^2 + 2as", explanation: "Useful when time is unknown." },
      ],
      examples: [
        "Starting from rest with a = 3 m/s² for 5 s: v = 0 + 3(5) = 15 m/s.",
      ],
      examTips: [
        "State the constant-acceleration condition explicitly.",
        "If a graph is curved, these equations do not apply.",
      ],
    },
    {
      heading: "3. Graphs and relative velocity",
      explanation:
        "On a v–t graph, slope = acceleration and area under the line = displacement. A curved v–t graph means acceleration is not constant. For relative velocity in the same direction, subtract the velocities. For river-boat problems, resolve boat and river velocities as perpendicular vectors.",
      keyPoints: [
        "v–t slope = acceleration.",
        "v–t area = displacement.",
        "Same-direction relative velocity: subtract; perpendicular components: resolve as vectors.",
        "Curved v–t graph means non-constant acceleration.",
      ],
      definitions: [
        { term: "Relative velocity", definition: "The velocity of one object as measured in another object's frame of reference." },
        { term: "Component", definition: "The projection of a vector along an axis." },
      ],
      formulas: [
        { formula: "v_{AB} = v_A - v_B", explanation: "Velocity of A relative to B when they move along the same line." },
      ],
      examples: [
        "A boat points straight across a river while the current flows downstream. The boat's actual velocity is the vector sum of its own velocity and the river's velocity.",
      ],
      examTips: [
        "Draw a vector diagram for river-boat problems.",
        "For area under a v–t graph, pay attention to signs below the time axis.",
      ],
    },
  ],
  keyTakeaways: [
    "Distance and displacement are not interchangeable.",
    "Velocity includes direction; speed does not.",
    "The three equations apply only for constant acceleration.",
    "v–t graph: slope is acceleration, area is displacement.",
    "The audio's exponent correction is flagged uncertain because of masking; verify it.",
  ],
  importantExamPoints: [
    "Explain why displacement can be zero with non-zero distance.",
    "Apply v = u + at, s = ut + ½at² and v² = u² + 2as under constant acceleration.",
    "Interpret v–t slope and area.",
    "Resolve relative velocity in one dimension and in river-boat problems.",
    "Identify the conditions under which the equations do not apply.",
  ],
  uncertainAreas: [
    {
      topic: "Exponent correction at ~01:56",
      reason:
        "The recording's correction is partly masked by hum. The system keeps the standard t² reading but marks it unverified.",
    },
  ],
};

export const audioQuiz: QuizContent = {
  title: "Kinematics lecture — grounded audio quiz",
  difficulty: "mixed",
  questions: [
    {
      id: "q1",
      question: "According to the lecture, when do the three equations of motion apply?",
      options: [
        "Only when acceleration is constant.",
        "Only when the object starts from rest.",
        "Only when the motion is vertical.",
        "For every motion, including curved velocity–time graphs.",
      ],
      correctIndex: 0,
      explanation:
        "The recording says the equations apply only when acceleration is constant. Starting from rest is a special case, and a curved v–t graph means acceleration changes.",
      difficulty: "easy",
      concept: "Equations of motion",
      sourceExcerpt: "The three standard equations apply only when acceleration is constant.",
    },
    {
      id: "q2",
      question: "What does the area under a velocity–time graph represent?",
      options: ["Acceleration", "Displacement", "Speed", "Relative velocity"],
      correctIndex: 1,
      explanation:
        "The lecture states that on a v–t graph, slope is acceleration and area under the line is displacement.",
      difficulty: "easy",
      concept: "Motion graphs",
      sourceExcerpt: "On a velocity–time graph, slope is acceleration and area under the line is displacement.",
    },
    {
      id: "q3",
      question: "Two objects move in the same direction. How is relative velocity found?",
      options: [
        "Add the speeds.",
        "Subtract one velocity from the other.",
        "Multiply the velocities.",
        "Always add the vectors at 90°.",
      ],
      correctIndex: 1,
      explanation:
        "For motion in the same direction, the lecture says subtract the velocities. Perpendicular resolution is for river-boat problems.",
      difficulty: "medium",
      concept: "Relative velocity",
      sourceExcerpt: "For relative velocity in the same direction, subtract the velocities.",
    },
    {
      id: "q4",
      question: "Why does the transcript mark the exponent correction as uncertain?",
      options: [
        "The lecturer did not mention an exponent.",
        "The correction is partly masked by background hum.",
        "The equation has no exponent in kinematics.",
        "The recording is too short to contain a correction.",
      ],
      correctIndex: 1,
      explanation:
        "The audio contains a correction near 01:56, but the word after 't' is partly masked by hum. The system flags it instead of pretending it was clearly heard.",
      difficulty: "medium",
      concept: "Confidence and uncertainty",
      sourceExcerpt:
        "The lecturer's correction of the exponent at about 01:56 is partly masked. The transcript flags it and does not treat it as verified.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Reliability lab                                                            */
/* -------------------------------------------------------------------------- */

export const reliabilityDemo: ReliabilityRunResult = {
  title: "Ambiguous handwritten calculus fixture",
  detectedLanguage: "English",
  overallConfidence: 0.56,
  blocks: [
    {
      id: "rel-1",
      type: "heading",
      text: "Calc — integration practice",
      page: 1,
      confidence: 0.92,
      uncertain: false,
    },
    {
      id: "rel-2",
      type: "paragraph",
      text: "Q6. Evaluate the integral",
      page: 1,
      confidence: 0.9,
      uncertain: false,
    },
    {
      id: "rel-3",
      type: "formula",
      text: "∫ x² dx = x³/3 + C",
      page: 1,
      confidence: 0.93,
      uncertain: false,
    },
    {
      id: "rel-4",
      type: "unreadable",
      text: "Q7. ∫ x? dx",
      page: 1,
      confidence: 0.24,
      uncertain: true,
      note: "The exponent is smudged into the integral sign. The pixels do not distinguish x², x³ or x⁷.",
    },
    {
      id: "rel-5",
      type: "paragraph",
      text: "The exponent is smudged / overwritten.",
      page: 1,
      confidence: 0.88,
      uncertain: false,
    },
    {
      id: "rel-6",
      type: "paragraph",
      text: "Answer depends on the exponent; do not guess.",
      page: 1,
      confidence: 0.9,
      uncertain: false,
    },
  ],
  warnings: [
    {
      message:
        "The exponent in Q7 cannot be resolved from the image. A specific digit would be an invented fact.",
      severity: "critical",
      location: "Q7 · exponent",
    },
    {
      message:
        "Q7's answer was excluded from the generated revision material until a human supplies a legible correction.",
      severity: "warning",
    },
  ],
  modelNote:
    "Curated demo report, not a live model run. The fixture is designed so the exponent in Q7 is genuinely unrecoverable. The safe output is an unreadable block plus a warning; any definite exponent would be a guess. Use 'Run live test' with a Gemini key to capture the current model's actual behaviour.",
};
