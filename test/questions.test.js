import test from "node:test";
import assert from "node:assert/strict";
import { makeQuestion, isComplete } from "../src/questions.js";

const levels = ["kindergarten", "grade1", "grade2", "grade3"];
for (const subject of ["japanese", "math"]) {
  for (const level of levels) {
    test(`${subject} ${level}: every generated answer is a unique choice`, () => {
      for (let i = 0; i < 100; i += 1) {
        const question = makeQuestion(subject, level);
        assert.equal(question.choices.length, 3);
        assert.equal(new Set(question.choices).size, 3);
        assert.ok(question.choices.includes(question.answer));
        if (subject === "math") assert.ok(Number(question.answer) >= 0);
      }
    });
  }
}

test("completion uses time OR correct answers", () => {
  const settings = { minutes: 30, questions: 10 };
  assert.equal(isComplete({ activeSeconds: 1799, correct: 9 }, settings), false);
  assert.equal(isComplete({ activeSeconds: 1800, correct: 0 }, settings), true);
  assert.equal(isComplete({ activeSeconds: 0, correct: 10 }, settings), true);
});
