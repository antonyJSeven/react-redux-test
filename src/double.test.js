import double from "./double";

describe("Double", () => {
  it("Should double an array of numbers", () => {
    let input = [1, 2, 3];
    let result = double(input);
    expect(result).toEqual([2, 4, 6]);
  });
})
