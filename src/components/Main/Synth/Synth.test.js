import React from "react";
import { shallow } from "enzyme";
import Synth from "./Synth";

describe("Synth", () => {
  test("matches snapshot", () => {
    const wrapper = shallow(<Synth />);
    expect(wrapper).toMatchSnapshot();
  });
});
