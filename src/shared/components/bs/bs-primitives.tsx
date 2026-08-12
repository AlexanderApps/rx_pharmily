// Native: pass straight through to @gorhom/bottom-sheet's own primitives,
// which need to run inside its gesture/scroll context to behave correctly.
// See bs-primitives.web.tsx for the web counterpart — on web our sheets
// render as plain modal dialogs (see bottom-sheet.web.tsx), so these need
// to be ordinary React Native components instead.
export {
  BottomSheetView as BsView,
  BottomSheetScrollView as BsScrollView,
  BottomSheetFlatList as BsFlatList,
  BottomSheetTextInput as BsTextInput,
} from "@gorhom/bottom-sheet";
