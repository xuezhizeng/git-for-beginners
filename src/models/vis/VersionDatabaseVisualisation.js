import { computed, observable, action, reaction } from 'mobx';

import Visualisation from './Visualisation';
import VisualisationArea from './VisualisationArea';
import VisualisationFile from './VisualisationFile';
import { STATUS_DELETED, STATUS_ADDED, STATUS_MODIFIED } from '../../constants';

const FILE_NAME_VARIANTS = [
  '_final',
  '_final_final',
  '_final_v2_final',
  '_final_forreal',
  '_finaaal',
  '_finalalal',
  '_final_hahaha',
  '_final_ineedhelp',
  '_final_itsatrap',
];

class FileVisualisation extends VisualisationFile {
  @observable diff;
  @observable nameIndex;
  @observable status;

  constructor(vis, nameIndex, diff = { added: 0, removed: 0 }) {
    super();

    this.status = STATUS_ADDED;

    this.nameIndex = nameIndex;
    this.vis = vis;
    this.diff = diff;
  }

  getPosition() {
    const position = super.getPosition();
    const index = this.vis.files.indexOf(this);

    if (this.vis.useVersionDatabase) {
      position.row = index === 0 ? 0 : index - 1;
      position.column = index === 0 ? 0 : 1;
    } else {
      position.column = index;
    }

    return position;
  }

  @computed
  get name() {
    if (this.vis.useVersionDatabase) {
      if (this.vis.files.indexOf(this) === 0) {
        return 'file';
      }

      return `Version ${this.parent.children.length - this.index}`;
    }

    if (this.nameIndex === 0) {
      return 'file';
    }

    return `file${
      FILE_NAME_VARIANTS[(this.nameIndex - 1) % FILE_NAME_VARIANTS.length]
    }`;
  }

  @computed
  get changes() {
    return this.diff.added + this.diff.removed;
  }

  @computed
  get maxChanges() {
    return Math.max(...this.vis.files.map(file => file.changes));
  }

  @action
  copy() {
    const copy = super.copy(this.vis, this.nameIndex);

    copy.status = STATUS_MODIFIED;

    return copy;
  }
}

class VersionDatabaseVisualisation extends Visualisation {
  @observable files = [];
  @observable useVersionDatabase = false;
  @observable nameIndex = 0;

  constructor() {
    super();

    this.versionDatabase = new VisualisationArea('Version Database');
    this.versionDatabase.column = 1;
    this.versionDatabase.height = 10;

    reaction(
      () => ({
        files: this.files.length,
        useVersionDatabse: this.useVersionDatabase,
      }),
      this.handleFiles,
      true,
    );
  }

  @action.bound
  handleVersionDatabase() {
    if (this.useVersionDatabase) {
      this.add(this.versionDatabase);
    } else {
      this.remove(this.versionDatabase);
    }
  }

  @action.bound
  handleFiles() {
    let children = this.files.slice();

    if (this.useVersionDatabase) {
      this.versionDatabase.set(...children.slice(1));

      children = [this.versionDatabase, children[0]];
    }

    this.set(...children);
  }

  @action
  addFile() {
    const file = new FileVisualisation(this, this.nameIndex++);
    file.status = STATUS_ADDED;

    this.files.unshift(file);
  }

  @action
  modifyFile(fileIndex, diff) {
    const file = this.files[fileIndex];

    file.status = STATUS_MODIFIED;
    file.diff = diff;
  }

  @action
  copyFile(fileIndex) {
    const file = this.files[fileIndex];
    const copy = file.copy();

    copy.nameIndex = this.nameIndex++;

    this.files.unshift(copy);
    this.active = false;

    if (file.status === STATUS_DELETED) {
      copy.visible = false;
    }
  }

  @action
  deleteFile(fileIndex) {
    const file = this.files[fileIndex];
    file.status = STATUS_DELETED;

    if (!this.useVersionDatabase) {
      this.files.remove(file);
    }
  }

  @action
  restoreFile(fileIndex) {
    const file = this.files[fileIndex];
    const copy = file.copy();
    copy.prevVisFile = file;

    this.files[0].status = STATUS_DELETED;
    this.files.shift();
    this.files.unshift(copy);

    copy.diff = file.diff;
    copy.status = STATUS_MODIFIED;
  }
}

export default VersionDatabaseVisualisation;
