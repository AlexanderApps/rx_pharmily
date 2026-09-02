import { TextStyle } from "react-native";

// userSelect is a web-only CSS property react-native-web recognizes on
// Text's style prop, but it isn't part of React Native's own TextStyle
// type — hence the cast, centralized here once rather than repeated
// (and re-typed slightly differently) at every call site. A no-op on
// native, where there's no concept of text selection via a mouse drag
// to begin with.
//
// Applied to UI chrome — button/link labels, nav items, tab labels,
// badge/pill text, icon-adjacent labels — anything that's part of the
// interface rather than content a user might want to copy. Deliberately
// NOT applied to post/comment bodies, RFQ/donation/job descriptions,
// chat messages, or form field values, which keep the default (fully
// selectable) browser behavior.
export const noSelectStyle: TextStyle = { userSelect: "none" } as TextStyle;
