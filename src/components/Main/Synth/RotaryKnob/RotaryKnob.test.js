import React from "react";
import { shallow } from "enzyme";
import RotaryKnob from "./RotaryKnob";

describe("RotaryKnob", () => {
  test("matches snapshot", () => {
    const wrapper = shallow(<RotaryKnob />);
    expect(wrapper).toMatchSnapshot();
  });
});
