"""Generate the sample syllabus PDF used by the demo.

Requires reportlab:  python -m pip install reportlab
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.graphics.shapes import Drawing, Line, Circle, String, Rect
from reportlab.graphics import renderPDF

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "samples"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor("#0F1433")
VIOLET = colors.HexColor("#6A3BFA")
SOFT = colors.HexColor("#F3F0FF")
LINE = colors.HexColor("#E4E1EF")

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        "CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=30,
        leading=34,
        textColor=NAVY,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        "CoverSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12.5,
        leading=18,
        textColor=colors.HexColor("#5B6188"),
        spaceAfter=18,
    )
)
styles.add(
    ParagraphStyle(
        "H1x",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        textColor=NAVY,
        spaceBefore=12,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        "H2x",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=VIOLET,
        spaceBefore=10,
        spaceAfter=3,
    )
)
styles.add(
    ParagraphStyle(
        "Bodyx",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.6,
        leading=14.5,
        textColor=colors.HexColor("#252B4B"),
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        "Smallx",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=11.5,
        textColor=colors.HexColor("#5B6188"),
    )
)
styles.add(
    ParagraphStyle(
        "Question",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=9.6,
        leading=14,
        textColor=NAVY,
        spaceBefore=4,
    )
)


def footer(c: canvas.Canvas, doc):
    c.saveState()
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(20 * mm, 16 * mm, 190 * mm, 16 * mm)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#858AA8"))
    c.drawString(20 * mm, 11 * mm, "CS204 · Data Structures & Algorithms · Semester 4")
    c.drawRightString(190 * mm, 11 * mm, f"Page {doc.page}")
    c.restoreState()


def boxed(text, bg=SOFT, border=VIOLET):
    t = Table([[Paragraph(text, styles["Bodyx"])]], colWidths=[168 * mm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("BOX", (0, 0), (-1, -1), 0.6, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return t


def linked_list_diagram():
    d = Drawing(450, 88)
    labels = ["head", "12", "7", "24", "null"]
    for i, label in enumerate(labels):
        x = 28 + i * 84
        if i == 0:
            d.add(String(x, 36, label, fontName="Helvetica-Bold", fontSize=9, fillColor=NAVY))
        else:
            d.add(Rect(x, 20, 66, 34, fillColor=SOFT, strokeColor=VIOLET, strokeWidth=0.8))
            d.add(String(x + 8, 32, label, fontName="Helvetica-Bold", fontSize=10, fillColor=NAVY))
            d.add(Line(x + 40, 20, x + 40, 54, strokeColor=VIOLET, strokeWidth=0.6))
            d.add(Circle(x + 53, 37, 2.3, fillColor=NAVY, strokeColor=NAVY))
        if i < len(labels) - 1:
            d.add(Line(x + 8 if i == 0 else x + 66, 37, x + 78, 37, strokeColor=NAVY, strokeWidth=0.9))
    d.add(String(28, 5, "Each node stores data + a pointer to the next node. Access is sequential: O(n).",
                 fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor("#5B6188")))
    return d


def tree_diagram():
    d = Drawing(450, 118)
    nodes = [(225, 92, "50"), (155, 58, "30"), (300, 58, "70"), (110, 24, "20"), (190, 24, "40"), (265, 24, "60"), (340, 24, "80")]
    for x, y, label in nodes:
        d.add(Circle(x, y, 15, fillColor=SOFT, strokeColor=VIOLET, strokeWidth=0.8))
        d.add(String(x - 6, y - 3, label, fontName="Helvetica-Bold", fontSize=8, fillColor=NAVY))
    for x1, y1, x2, y2 in [(225, 77, 155, 73), (225, 77, 300, 73), (155, 43, 110, 39), (155, 43, 190, 39), (300, 43, 265, 39), (300, 43, 340, 39)]:
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#B8A4FF"), strokeWidth=1))
    d.add(String(20, 105, "Binary Search Tree (inorder traversal is sorted): 20, 30, 40, 50, 60, 70, 80",
                 fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor("#5B6188")))
    return d


story = []
story.append(Spacer(1, 18 * mm))
story.append(Paragraph("CS204 · DATA STRUCTURES &amp; ALGORITHMS", styles["CoverTitle"]))
story.append(Paragraph("Semester 4 syllabus and study material · 4 credits · 2026–27", styles["CoverSub"]))
story.append(
    boxed(
        "<b>End-semester examination: 18 December 2026.</b> The exam is closed-book, 3 hours, and covers all five modules. "
        "Internal assessment includes two coding assignments and one mid-semester test. The syllabus explicitly rewards "
        "complexity analysis, correct edge-case handling, and the ability to choose an appropriate data structure."
    )
)
story.append(Spacer(1, 9 * mm))
story.append(Paragraph("Course outcomes", styles["H1x"]))
for line in [
    "CO1 — Analyse the time and space complexity of iterative and recursive algorithms using asymptotic notation.",
    "CO2 — Implement linear structures (arrays, linked lists, stacks, queues) and select them for real problems.",
    "CO3 — Traverse, search, insert and delete in trees and graphs, including balanced-tree ideas.",
    "CO4 — Apply hashing, sorting and dynamic programming to solve optimisation problems.",
    "CO5 — Reason about correctness, trade-offs, and edge cases in a written examination.",
]:
    story.append(Paragraph("&bull; " + line, styles["Bodyx"]))
story.append(Spacer(1, 7 * mm))
story.append(
    boxed(
        "<b>How this PDF is used in STUDYMATE AI:</b> this is a text-based PDF. The app extracts text page by page "
        "with a PDF parser, preserves page numbers for citations, chunks the content, embeds every chunk, and uses "
        "retrieval-augmented generation for questions. It does not send the whole document to the model for each question.",
        bg=colors.HexColor("#FFF7ED"),
        border=colors.HexColor("#F4B183"),
    )
)

story.append(PageBreak())

story.append(Paragraph("Module 1 · Arrays, Strings, and Complexity", styles["H1x"]))
story.append(Paragraph("1.1 Arrays and memory", styles["H2x"]))
story.append(
    Paragraph(
        "An array is a contiguous block of memory that stores elements of the same type. Because the address of the first "
        "element is known, the element at index <i>i</i> can be accessed in O(1) time: address = base + i × element_size. "
        "Insertion or deletion in the middle costs O(n) because later elements must shift. A dynamic array doubles its "
        "capacity when full, giving an amortised O(1) append cost.",
        styles["Bodyx"],
    )
)
story.append(Paragraph("1.2 Strings", styles["H2x"]))
story.append(
    Paragraph(
        "A string is a sequence of characters. In most languages strings are immutable, so concatenating in a loop can "
        "cost O(n²). Use a character array or a builder instead. Important patterns: two pointers, sliding window, prefix "
        "sums, and frequency arrays. Always clarify whether the input alphabet is ASCII or Unicode, and whether "
        "case matters.",
        styles["Bodyx"],
    )
)
story.append(Paragraph("1.3 Asymptotic analysis", styles["H2x"]))
story.append(
    Paragraph(
        "Big-O gives an upper bound on growth, Big-Omega a lower bound, and Big-Theta a tight bound. Drop constants and "
        "lower-order terms: 3n² + 5n + 9 is Θ(n²). Common growth rates from fastest to slowest: O(1), O(log n), O(n), "
        "O(n log n), O(n²), O(2ⁿ), O(n!). Master theorem: for T(n) = aT(n/b) + f(n), compare f(n) with n^(log_b a).",
        styles["Bodyx"],
    )
)
story.append(Paragraph("Worked example", styles["H2x"]))
story.append(
    boxed(
        "Find the largest sum of any contiguous subarray. Brute force checks all O(n²) subarrays. Kadane's algorithm "
        "keeps the best sum ending at the current position: current = max(a[i], current + a[i]); best = max(best, current). "
        "This is O(n) time and O(1) extra space, and works for arrays containing negative numbers."
    )
)
story.append(Spacer(1, 5 * mm))
story.append(Paragraph("Module 2 · Linked Lists, Stacks, and Queues", styles["H1x"]))
story.append(Paragraph("2.1 Linked lists", styles["H2x"]))
story.append(
    Paragraph(
        "A singly linked list stores each element in a node with a value and a next pointer. Insertion at the head is O(1); "
        "search is O(n); deleting a known node is O(1) if you have its predecessor. A doubly linked list also stores a "
        "previous pointer, enabling O(1) deletion with only the node reference. Linked lists avoid shifting but lose "
        "random access and have pointer overhead plus poor cache locality.",
        styles["Bodyx"],
    )
)
story.append(linked_list_diagram())
story.append(Paragraph("2.2 Stacks and queues", styles["H2x"]))
story.append(
    Paragraph(
        "A stack is LIFO: push and pop are O(1). Applications include expression evaluation, balanced parentheses, undo, "
        "and iterative DFS. A queue is FIFO: enqueue at the rear and dequeue from the front. A circular array queue "
        "avoids O(n) shifts. A deque supports both ends in O(1). A monotonic stack finds the next greater element in O(n).",
        styles["Bodyx"],
    )
)
story.append(Paragraph("Exam-style question", styles["Question"]))
story.append(
    Paragraph(
        "Q. Design a queue using two stacks and state the amortised cost of each operation. (6 marks)",
        styles["Bodyx"],
    )
)
story.append(
    Paragraph(
        "Answer outline: keep an input stack and an output stack. Push is O(1). To dequeue, if the output stack is empty, "
        "pop every element from input and push it onto output; then pop output. Each element moves at most once, so the "
        "amortised dequeue cost is O(1), even though a single dequeue can be O(n).",
        styles["Smallx"],
    )
)

story.append(PageBreak())

story.append(Paragraph("Module 3 · Trees, Heaps, and Balanced Search Trees", styles["H1x"]))
story.append(Paragraph("3.1 Binary trees and traversals", styles["H2x"]))
story.append(
    Paragraph(
        "A binary tree has at most two children per node. Depth-first traversals are preorder (node, left, right), inorder "
        "(left, node, right), and postorder (left, right, node). In a binary search tree (BST), every left value is smaller "
        "and every right value is larger, so inorder traversal yields sorted order. Search, insert and delete are O(h), "
        "where h is height: O(log n) when balanced, O(n) in the worst case.",
        styles["Bodyx"],
    )
)
story.append(tree_diagram())
story.append(Paragraph("3.2 Heaps and priority queues", styles["H2x"]))
story.append(
    Paragraph(
        "A binary heap is a complete tree stored in an array: children of index i are 2i+1 and 2i+2. A min-heap keeps the "
        "smallest key at the root. Insert and extract-min are O(log n); peek is O(1); building a heap bottom-up is O(n). "
        "Heap sort repeatedly extracts the root, giving O(n log n) time and O(1) extra array space. Priority queues are "
        "used in Dijkstra's algorithm and task schedulers.",
        styles["Bodyx"],
    )
)
story.append(Paragraph("3.3 Balanced trees", styles["H2x"]))
story.append(
    Paragraph(
        "AVL trees maintain a balance factor in {-1, 0, 1} using rotations. Red-black trees relax balance but guarantee "
        "O(log n) height and are common in standard libraries. B-trees store many keys per node and are used for databases "
        "and file systems because they minimise disk reads.",
        styles["Bodyx"],
    )
)

story.append(Spacer(1, 5 * mm))
story.append(Paragraph("Module 4 · Graphs", styles["H1x"]))
story.append(Paragraph("4.1 Representations and traversal", styles["H2x"]))
story.append(
    Paragraph(
        "Graphs can be stored as an adjacency list O(V+E) or an adjacency matrix O(V²). Breadth-first search uses a queue "
        "and finds shortest paths in unweighted graphs. Depth-first search uses recursion or a stack and supports cycle "
        "detection, topological sorting, and connected components. Always mark nodes as visited to avoid infinite loops.",
        styles["Bodyx"],
    )
)
story.append(Paragraph("4.2 Shortest paths and minimum spanning trees", styles["H2x"]))
story.append(
    Paragraph(
        "Dijkstra's algorithm works for non-negative edge weights with a priority queue: O((V+E) log V). Bellman-Ford "
        "handles negative edges in O(VE) and detects negative cycles. Kruskal's MST algorithm sorts edges and uses union-find "
        "for cycle detection; Prim's algorithm grows a tree from a starting vertex. Topological sort is only defined for a "
        "directed acyclic graph (DAG).",
        styles["Bodyx"],
    )
)

story.append(PageBreak())

story.append(Paragraph("Module 5 · Hashing, Sorting, and Searching", styles["H1x"]))
story.append(Paragraph("5.1 Hash tables", styles["H2x"]))
story.append(
    Paragraph(
        "A hash function maps a key to an index. A collision occurs when two keys map to the same index. Chaining stores a "
        "list per bucket; open addressing probes for the next free slot. With a good hash function and load factor below "
        "1, average lookup is O(1); worst case is O(n). Load factor = number of entries / number of buckets. Rehashing "
        "restores a low load factor. Python's dict and Java's HashMap are hash tables.",
        styles["Bodyx"],
    )
)
story.append(Paragraph("5.2 Comparison sorting", styles["H2x"]))
story.append(
    Paragraph(
        "Bubble, insertion, and selection sort are O(n²) and useful mainly for teaching or tiny inputs. Merge sort is "
        "stable, O(n log n), and uses O(n) auxiliary space. Quicksort is usually fastest in practice, O(n log n) average and "
        "O(n²) worst case; randomised pivots reduce that risk. Heapsort is O(n log n) in place but not stable. Comparison "
        "sorting has a lower bound of Ω(n log n). Counting sort and radix sort can beat that bound when keys are small "
        "integers or fixed-length strings.",
        styles["Bodyx"],
    )
)
story.append(Paragraph("5.3 Binary search", styles["H2x"]))
story.append(
    Paragraph(
        "Binary search requires a sorted array. Compare the target with the middle element and discard half the remaining "
        "range; complexity is O(log n). Use mid = low + (high - low) // 2 to avoid integer overflow in fixed-width "
        "languages. The harder part is finding the correct invariant for 'first true' or 'last true' variants.",
        styles["Bodyx"],
    )
)

story.append(Spacer(1, 4 * mm))
story.append(Paragraph("Module 6 · Dynamic Programming and Greedy Methods", styles["H1x"]))
story.append(Paragraph("6.1 Dynamic programming", styles["H2x"]))
story.append(
    Paragraph(
        "Dynamic programming applies when a problem has overlapping subproblems and optimal substructure. Define the state, "
        "the transition, the base case, and the answer extraction. Top-down memoisation caches recursive results; "
        "bottom-up tabulation fills a table iteratively and can often save memory. Classic problems: 0/1 knapsack, longest "
        "common subsequence, edit distance, coin change, and matrix chain multiplication.",
        styles["Bodyx"],
    )
)
story.append(Paragraph("6.2 Greedy vs dynamic programming", styles["H2x"]))
story.append(
    Paragraph(
        "A greedy algorithm makes the locally best choice and never reconsiders. It is correct only when the problem has "
        "the greedy-choice property and optimal substructure. Activity selection and Huffman coding are greedy. When a "
        "local choice can block a better global solution, use dynamic programming instead. A common exam trap is claiming "
        "that the greedy coin-change algorithm is always optimal; it fails for coin sets such as {1, 3, 4} and target 6.",
        styles["Bodyx"],
    )
)

story.append(PageBreak())

story.append(Paragraph("Assessment and revision guidance", styles["H1x"]))
story.append(
    Paragraph(
        "Internal assessment: 30%. End-semester examination: 70%. The written exam contains short-answer questions, "
        "complexity derivations, tracing questions, and one design question. Code is not executed during the exam; "
        "pseudocode with clear invariants and edge cases is expected.",
        styles["Bodyx"],
    )
)
rows = [
    ["Component", "Weight", "Notes"],
    ["Mid-semester test", "15%", "Modules 1–3"],
    ["Coding assignment 1", "7.5%", "Arrays, strings, complexity"],
    ["Coding assignment 2", "7.5%", "Graphs and dynamic programming"],
    ["End-semester exam", "70%", "All modules, closed book"],
]
table = Table(rows, colWidths=[70 * mm, 28 * mm, 70 * mm])
table.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F7FC")]),
            ("GRID", (0, 0), (-1, -1), 0.4, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]
    )
)
story.append(table)
story.append(Spacer(1, 8 * mm))
story.append(Paragraph("High-yield exam points", styles["H1x"]))
for line in [
    "State complexity in terms of n, V and E, and say whether it is average or worst case.",
    "For every algorithm, mention the invariant and one edge case (empty input, one element, duplicates, disconnected graph).",
    "Know the difference between a stable sort and an in-place sort, and give one example of each.",
    "Be able to compare adjacency list and adjacency matrix for sparse and dense graphs.",
    "For dynamic programming, write the recurrence before writing code.",
    "Simulate a small example by hand; it catches off-by-one errors quickly.",
]:
    story.append(Paragraph("&bull; " + line, styles["Bodyx"]))
story.append(Spacer(1, 5 * mm))
story.append(
    boxed(
        "Revision plan suggestion: spend the first 40% of available time on weak modules, 30% on active recall and "
        "past questions, 20% on timed practice, and 10% on a final error log. Revisit mistakes after 24 hours and again "
        "after one week — spaced repetition is more effective than rereading."
    )
)

doc = BaseDocTemplate(
    str(OUT / "sample-syllabus.pdf"),
    pagesize=A4,
    leftMargin=21 * mm,
    rightMargin=21 * mm,
    topMargin=18 * mm,
    bottomMargin=22 * mm,
    title="CS204 Data Structures and Algorithms — Semester 4 Syllabus",
    author="STUDYMATE AI sample material",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])
doc.build(story)
print("wrote", OUT / "sample-syllabus.pdf")
