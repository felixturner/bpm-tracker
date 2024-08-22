/*

    GUIOptions

    Given an params object, automatically create associated GUI controls

    USAGE: 

    import GUIOptions from '../../../lib/GUIOptions.js';

    let guiParams = {
        show: { type: 'bool', value: false, gui: true },
        scale: { type: 'f', value: 0.5, min: 0, max: 1, step: 0.001, gui: true },
        meshColor: { type: 'color', value: 0xffffff, gui: true },
    };

  let gui = new GUI();
	let guiOptions = new GUIOptions(guiParams, gui, {open:false} );


 */

export class GUIOptions {
  constructor(params, parentGUI, folderName = null, onChangeCallback = null, { open = true, hide = false } = {}) {
    this.params = params;

    if (hide) return;

    //if no GUI options bail out
    let guiCount = 0;
    for (let param in params) {
      if (params[param].gui) {
        guiCount++;
      }
    }
    if (guiCount === 0) {
      return;
    }

    if (folderName) {
      this.gui = parentGUI.addFolder(folderName);
    } else {
      this.gui = parentGUI;
    }

    if (open) {
      this.gui.open();
    }

    //create a control for each param
    for (let [key, param] of Object.entries(params)) {
      if (param.gui) {
        let controller;
        if (param.type === 'color') {
          controller = this.gui.addColor(param, 'value');
        } else if (param.type === 'combo') {
          controller = this.gui.add(param, 'value', param.options);
        } else if (param.type === 'func') {
          controller = this.gui.add(param, 'value');
        } else {
          controller = this.gui.add(param, 'value', param.min, param.max, param.step);
        }
        //always listen (performance issue?)
        controller.listen();

        let name = !param.name ? key : param.name;
        controller.name(name);

        if (onChangeCallback) {
          controller.onChange(onChangeCallback);
        }
      }
    }
    return this.gui;
  }

  randomize() {
    for (let [key, param] of Object.entries(this.params)) {
      // if (param.gui) {
      if (param.type === 'f') {
        param.value = param.min + (param.max - param.min) * Math.random();
        //round to step
        if (param.step) {
          param.value = Math.round(param.value / param.step) * param.step;
        }
      }
      // }
    }
  }
}
