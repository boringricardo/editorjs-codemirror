import { IconBrackets } from '@codexteam/icons';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';

import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
import { sass } from '@codemirror/lang-sass';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';

import { StreamLanguage } from '@codemirror/language';
import { clojure } from '@codemirror/legacy-modes/mode/clojure';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { elixir } from 'codemirror-lang-elixir';
import { gherkin } from '@codemirror/legacy-modes/mode/gherkin';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { nginx } from '@codemirror/legacy-modes/mode/nginx';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';

import themeOverrides from './config/themeOverrides';

export default class CodeMirrorTool {
  static get isReadOnlySupported() {
    return true;
  }

  static get enableLineBreaks() {
    return true;
  }

  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.selectedLanguage = data.language || 'plaintext';

    this.nodes = {
      holder: null,
      languagePicker: null,
    };

    this.languages = [
      { name: 'Plaintext', value: 'plaintext', extension: [] },
      { name: 'Clojure', value: 'clojure', extension: StreamLanguage.define(clojure) },
      { name: 'CSS', value: 'css', extension: css },
      { name: 'Dockerfile', value: 'dockerfile', extension: StreamLanguage.define(dockerFile) },
      { name: 'Gherkin', value: 'gherkin', extension: StreamLanguage.define(gherkin) },
      { name: 'HTML', value: 'html', extenstion: html },
      { name: 'JavaScript', value: 'javascript', extenstion: javascript },
      { name: 'JSON', value: 'json', extenstion: json },
      { name: 'Lua', value: 'lua', extension: StreamLanguage.define(lua) },
      { name: 'Markdown', value: 'markdown', extenstion: markdown },
      { name: 'Nginx', value: 'nginx', extension: StreamLanguage.define(nginx) },
      { name: 'PHP', value: 'php', extenstion: php },
      { name: 'Python', value: 'python', extenstion: python },
      { name: 'Ruby', value: 'ruby', extension: StreamLanguage.define(ruby) },
      { name: 'Sass', value: 'sass', extenstion: sass },
      { name: 'SCSS', value: 'scss', extenstion: sass },
      { name: 'SQL', value: 'sql', extenstion: sql },
      { name: 'XML', value: 'xml', extenstion: xml },
      { name: 'YAML', value: 'yaml', extentsion: StreamLanguage.define(yaml) },
    ];

    this.codeMirrorInstance = null;

    this.nodes.holder = this.drawView(data);
  }

  drawView(data) {
    let wrapper = document.createElement('div');
    let codeEditor = document.createElement('div');

    let theme = new Compartment();
    let language = new Compartment();

    let domEventHandlers = EditorView.domEventHandlers({
      // prevent codemirror and editorjs both handle pastes
      paste(event, view) {
        event.stopPropagation();
      },
    });

    let codeMirrorExtensions = [
      basicSetup,
      language.of(this._getLanguageExtension()),
      theme.of(oneDark),
      EditorView.theme(themeOverrides),
      domEventHandlers,
      keymap.of([indentWithTab]),
    ];

    if (this.isReadOnly) {
      codeMirrorExtensions.push(EditorState.readOnly.of(true));
    }

    this.codeMirrorInstance = new EditorView({
      doc: data.code,
      extensions: codeMirrorExtensions,
      parent: codeEditor,
    });

    codeEditor.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'Tab':
          this.tabHandler(e);
          break;
      }
    });

    let languagePickerWrapper = document.createElement('div');
    languagePickerWrapper.style = 'text-align: right;';

    let languagePicker = document.createElement('select');
    languagePicker.title = 'Language Mode Selector';
    this.nodes.languagePicker = languagePicker;

    languagePickerWrapper.appendChild(languagePicker);

    this.languages.forEach((language) => {
      let option = document.createElement('option');
      option.value = language.value;
      option.text = language.name;

      if (language.value === this.selectedLanguage) {
        option.selected = true;
      }

      languagePicker.appendChild(option);
    }, this);

    languagePicker.addEventListener('change', (e) => {
      this.selectedLanguage = e.target.value;
      let selectedLanguageExtension = this._getLanguageExtension();

      if (selectedLanguageExtension) {
        this.codeMirrorInstance.dispatch({
          effects: language.reconfigure(selectedLanguageExtension),
        });
      } else {
        throw 'Selected language not found';
      }
    });

    wrapper.appendChild(codeEditor);
    wrapper.appendChild(languagePickerWrapper);

    return wrapper;
  }

  render() {
    return this.nodes.holder;
  }

  save() {
    return {
      code: this.codeMirrorInstance.state.doc.toString(),
      language: this.nodes.languagePicker.value,
    };
  }

  static get pasteConfig() {
    return {
      tags: ['pre', 'code'],
    };
  }

  onPaste(e) {
    const content = e.detail.data;

    if (this.codeMirrorInstance) {
      this.codeMirrorInstance.dispatch({
        changes: {
          from: 0,
          to: this.codeMirrorInstance.state.doc.length,
          insert: content.textContent,
        }
      });
    }
  }

  static get toolbox() {
    return {
      icon: IconBrackets,
      title: 'CodeMirror',
    };
  }

  static get sanitize() {
    return {
      code: true, // allow html tags
    };
  }

  tabHandler(e) {
    // prevent editorjs tab handler
    event.stopPropagation();
  }

  _getLanguageExtension() {
    let selectedLanguage = this.languages.find((lang) => {
      return lang.value === this.selectedLanguage;
    });

    if (typeof selectedLanguage.extension === 'function') {
      return selectedLanguage.extension();
    } else {
      return selectedLanguage.extension;
    }
  }
}
