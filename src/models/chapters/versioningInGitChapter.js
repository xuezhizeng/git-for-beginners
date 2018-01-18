import React, { Fragment } from "react";

import { createChapter, init } from "../Chapter";
import { ChapterText, ChapterTask } from "../ChapterSection";
import Tooltip from "../../components/Tooltip";
import Visualisation from "../Visualisation";
import VisualisationArea from "../VisualisationArea";
import VisualisationFileList from "../VisualisationFileList";
import VisualisationFile, { createModifications } from "../VisualisationFile";
import { STATUS_DELETED, STATUS_ADDED } from "../../constants";
import ConsoleCommand from "../ConsoleCommand";
import { createAction } from "../Action";
import VisualisationCommit from "../VisualisationCommit";
import VisualisationStagingArea from "../VisualisationStagingArea";
import VisualisationRepository from "../VisualisationRepository";
import { VisualisationCommitReference, VisualisationFileReference } from "../../components/VisualisationObjectReference";
import Console from "../Console";

const addFile = createAction('ADD_FILE');
const stageFile = createAction('STAGE_FILE');
const stageAllFiles = createAction('STAGE_ALL_FILES');
const unstageFile = createAction('UNSTAGE_FILE');
const deleteFile = createAction('DELETE_FILE');
const createCommit = createAction('CREATE_COMMIT');
const modifyFile = createAction('MODIFY_FILE', fileIndex => {
  const { insertions, deletions } = createModifications();

  return {
    fileIndex,
    insertions,
    deletions,
  };
});
const revertCommit = createAction('REVERT_COMMIT');

const versioningInGitChapter = createChapter('Versioning in Git', {
  head: null,
  get hasRevertedCommit() {
    return this.state.has(revertCommit);
  },
  get activeFile() {
    const activeFile = this.vis.find(object => object.isFile && object.active);

    return activeFile;
  },
  get activeFileIndex() {
    if (this.activeFile == null) {
      return -1;
    }

    return this.activeFile.nestedIndex;
  },
  get activeCommitIndex() {
    return this.repository.commits.find(commit => commit.active).nestedIndex;
  },
  [init]() {
    this.vis = new Visualisation();

    this.workingDirectoryFileList = new VisualisationCommit();
    this.stagingAreaFileList = new VisualisationCommit();

    this.workingDirectory = new VisualisationArea('Working Directory');
    this.workingDirectory.add(this.workingDirectoryFileList);

    this.stagingArea = new VisualisationStagingArea();
    this.stagingArea.column = 1;
    this.stagingArea.add(this.stagingAreaFileList);

    this.repository = new VisualisationRepository();
    this.repository.column = 2;
    this.repository.height = 10;
    this.repository.width = 4;

    this.vis.add(
      this.workingDirectory,
      this.stagingArea,
      this.repository,
    );

    const files = [
      new VisualisationFile(),
      new VisualisationFile(),
      new VisualisationFile()
    ];

    this.workingDirectoryFileList.add(
      ...files
    );

    this.console = new Console();

    this.console.add(
      new ConsoleCommand('Working Directory', {
        available: () => this.workingDirectory.active,
        commands: [
          new ConsoleCommand('Modify file', {
            available: () => this.activeFile != null,
            icon: '+-',
            message: ({ data }) => (
              <Fragment>
                <VisualisationFileReference vis={this.vis} file={data}>File</VisualisationFileReference> was modified.
              </Fragment>
            ),
            action: modifyFile,
            payloadCreator: () => this.activeFileIndex,
          }),
          new ConsoleCommand('Stage file', {
            available: () => this.activeFile != null,
            icon: '↗',
            message: ({ data }) => (
              <Fragment>
                <VisualisationFileReference vis={this.vis} file={data}>File</VisualisationFileReference> was added to the staging area.
              </Fragment>
            ),
            action: stageFile,
            payloadCreator: () => this.activeFileIndex
          }),
          new ConsoleCommand('Stage all files', {
            icon: '↗',
            message: () => 'All files were added to the staging area.',
            action: stageAllFiles,
          }),
          new ConsoleCommand('Delete file', {
            available: () => this.activeFile != null,
            icon: '×',
            message: ({ data }) => (
              <Fragment>
                <VisualisationFileReference vis={this.vis} file={data}>File</VisualisationFileReference> was deleted.
              </Fragment>
            ),
            action: deleteFile,
            payloadCreator: () => this.activeFileIndex,
          })
        ],
      }),
      new ConsoleCommand('Staging Area', {
        available: () => this.stagingArea.active,
        commands: [
          new ConsoleCommand('Create commit', {
            icon: '↗',
            message: ({ data }) => (
              <Fragment>
                New commit <VisualisationCommitReference vis={this.vis} commit={data} /> was stored in the repository.
              </Fragment>
            ),
            action: createCommit,
          }),
          new ConsoleCommand('Unstage file', {
            icon: '↙',
            message: ({ data }) => (
              <Fragment>
                <VisualisationFileReference vis={this.vis} file={data}>File</VisualisationFileReference> was removed from the staging area.
              </Fragment>
            ),
            action: unstageFile,
            payloadCreator: () => this.activeFileIndex,
          }),
        ],
      }),
      new ConsoleCommand('Repository', {
        available: () => this.repository.active,
        commands: [
          new ConsoleCommand('Revert commit', {
            icon: '↙',
            message: ({ data }) => (
              <Fragment>
                Commit <VisualisationCommitReference vis={this.vis} commit={data} /> was revereted successfully.
              </Fragment>
            ),
            action: revertCommit,
            payloadCreator: () => this.activeCommitIndex,
          }),
        ],
      }),
      new ConsoleCommand('Add new file.', {
        icon: '+',
        available: () => !this.vis.active,
        message: ({ data }) => (
          <Fragment>
            A new <VisualisationFileReference vis={this.vis} file={data}>file</VisualisationFileReference> was added.
          </Fragment>
        ),
        action: addFile,
      }),
    );
  },
  [addFile]() {
    const file = new VisualisationFile();

    this.workingDirectoryFileList.add(file);
    return file;
  },
  [stageFile](fileIndex) {
    const file = this.vis.at(...fileIndex);
    let stagedFile = this.stagingAreaFileList.findCopies(file)[0];

    if (stagedFile != null && !file.modified) {
      throw () => 'File already staged.';
    }

    if (file.status !== STATUS_ADDED && file.status !== STATUS_DELETED && !file.modified) {
      throw () => 'Only modified files can be staged.';
    }

    if (stagedFile == null) {
      stagedFile = file.copy();
      this.stagingAreaFileList.add(stagedFile);
      this.stagingAreaFileList.sortBy(file => (
        this.workingDirectoryFileList.findCopies(file)[0].index
      ));
    } else {
      stagedFile.merge(file);
    }

    if (file.status !== STATUS_DELETED) {
      file.reset();
    } else {
      file.visible = false;
    }

    return stagedFile;
  },
  [stageAllFiles]() {
    let files = this.workingDirectoryFileList.files;

    files.forEach(file => {
      let stagedFile = this.stagingAreaFileList.findCopies(file)[0];

      if (stagedFile != null && !file.modified) {
        return;
      }

      if (file.status !== STATUS_ADDED && file.status !== STATUS_DELETED && !file.modified) {
        return;
      }

      if (stagedFile == null) {
        stagedFile = file.copy();
        this.stagingAreaFileList.add(stagedFile);
        this.stagingAreaFileList.sortBy(file => (
          this.workingDirectoryFileList.findCopies(file)[0].index
        ));
      } else {
        stagedFile.merge(file);
      }

      if (file.status !== STATUS_DELETED) {
        file.reset();
      } else {
        file.visible = false;
      }
    });
  },
  [unstageFile](fileIndex) {
    const file = this.vis.at(...fileIndex);
    const unstagedFile = this.workingDirectoryFileList.findCopies(file)[0];

    unstagedFile.reset(file);
    unstagedFile.visible = true;
    this.stagingAreaFileList.remove(file);

    return unstagedFile;
  },
  [deleteFile](fileIndex) {
    const file = this.vis.at(...fileIndex);

    file.status = STATUS_DELETED;

    return file;
  },
  [modifyFile]({ fileIndex, insertions, deletions }) {
    const file = this.vis.at(...fileIndex);

    file.insertions += insertions;
    file.deletions += deletions;

    return file;
  },
  [createCommit]() {
    const lastCommit = this.repository.commits[this.repository.commits.length - 1];
    let commit;

    if (lastCommit == null) {
      commit = new VisualisationCommit();
    } else {
      commit = lastCommit.copy();

      commit.files.forEach(file => {
        if (file.status === STATUS_DELETED) {
          file.visible = false;
        }

        const stagedFile = this.stagingAreaFileList.findCopies(file)[0];

        if (stagedFile != null) {
          file.reset(stagedFile);
          // @IDEA for later: copy also already existing files (copies) into commit and ignore copies while calculating the level.
          this.stagingAreaFileList.remove(stagedFile);
        } else {
          file.reset();
        }
      });

      commit.parentCommit = lastCommit;
    }

    commit.add(
      ...this.stagingAreaFileList.files,
    );

    this.repository.add(commit);
    this.head = commit;

    return commit;
  },
  [revertCommit](commitIndex) {
    const commit = this.vis.at(...commitIndex);

    let parentCommit = this.head;

    while (parentCommit != null) {
      parentCommit.files.forEach(file => {
        const baseFile = this.workingDirectoryFileList.findCopies(file)[0];

        baseFile.revert(file);
        baseFile.visible = baseFile.status !== STATUS_DELETED;
      });

      if (parentCommit === commit) {
        break;
      }

      parentCommit = parentCommit.parentCommit;
    }

    return commit;
  },
  get sections() {
    return [
      new ChapterText(() => (
        <Fragment>
          Let’s take a look at how a <Tooltip name="commit">commit</Tooltip> is created.
        </Fragment>
      )),
      new ChapterTask(() => (
        <Fragment>Add files to the <Tooltip name="stagingArea">staging area</Tooltip>.</Fragment>
      ), this.stagingAreaFileList.files.length > 0 || this.repository.commits.length > 0),
      new ChapterText(() => (
        <Fragment>
          Did you see how files moved from the <Tooltip name="workingDirectory">working directory</Tooltip> to the staging area? These files changes are ready to be part of the next version, the next commit. <em>You can add more files, if you want. The stage is yours, actually.</em>
        </Fragment>
      ), { skip: true }),
      new ChapterTask(() => 'Create a new commit.', this.repository.commits.length > 0),
      new ChapterText(() => (
        <Fragment>
          Perfect. A new commit was created and added to the <Tooltip name="repository">repository</Tooltip>. Like we said, each commit has a unique identifier, so we can reference it for example in the interactive menu below the visualisation.
        </Fragment>
      ), { skip: true }),
      new ChapterTask(() => 'Create at least two more commits.', this.repository.commits.length > 2),
      new ChapterText(() => 'Now that we have a few more versions of our project, let’s take a look at how to restore an older version.', { skip: true }),
      new ChapterTask(() => 'Restore a commit.', this.hasRevertedCommit),
      new ChapterText(() => (
        <Fragment>
          Well done! A few commits were created and an older version of your project restored. <em>Go ahead, if you like, and play around with your git powered project a little more.</em> Or jump directly to the …
        </Fragment>
      ), { skip: true }),
    ];
  },
});

export default versioningInGitChapter;
