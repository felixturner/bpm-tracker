export const makeDroppable = (dropTarget, callback) => {
  if (typeof FileReader !== 'undefined') {
    dropTarget.addEventListener(
      'dragover',
      (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      false
    );

    dropTarget.addEventListener(
      'dragenter',
      (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      false
    );

    dropTarget.addEventListener(
      'drop',
      (dropEvt) => {
        dropEvt.preventDefault();
        dropEvt.stopPropagation();

        const file = dropEvt.dataTransfer.files[0];
        if (file) callback(file);
      },
      false
    );
  }
};

export function openFileDialog(callback) {
  let input = document.createElement('input');
  input.type = 'file';
  input.onchange = (e) => {
    let file = e.target.files[0];
    callback(file);
  };
  input.click();
}
