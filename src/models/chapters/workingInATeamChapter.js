import React, { Fragment } from "react";
import { observable, action, computed} from 'mobx';
import { action as popmotionAction, delay } from "popmotion";

import { createChapter, readOn, init } from "../Chapter";
import { ChapterText } from "../ChapterSection";
import Tooltip from "../../components/Tooltip";
import Visualisation from "../vis/Visualisation";
import VisualisationArea from "../vis/VisualisationArea";
import VisualisationFile from "../vis/VisualisationFile";
import chance from "../chance";
import { STATUS_UNMODIFIED, STATUS_MODIFIED } from "../../constants";

class FileVisualisation extends VisualisationFile {
  @observable diff = { added: 0, removed: 0 };
  @observable status = STATUS_UNMODIFIED;

  @action modify() {
    const { added, removed } = chance.diff();

    this.diff.added = Math.max(0, this.diff.added + added);
    this.diff.removed = Math.max(0, this.diff.removed + removed);
    this.status = STATUS_MODIFIED;
  }

  @computed get maxChanges() {
    return this.diff.added + this.diff.removed;
  }
}

const loop = (...actions) => popmotionAction(({ update, complete }) => {
  let i = 0;
  let current;

  const playCurrent = () => {
    current = actions[i].start({
      complete: () => {
        i++;

        if (i >= actions.length) {
          i = 0;
        }

        playCurrent();
      },
      update
    });
  };

  playCurrent();

  return {
    stop: () => current != null && current.stop(),
  };
});

const actionQueue = () => popmotionAction(({ update, complete }) => {
  let i = 0;
  const queue = [];
  let current;
  let playing = false;

  const playCurrent = () => {
    if (playing || queue.length === 0) {
      return;
    }

    playing = true;
    current = queue[i].start({
      complete: () => {
        i++;
        playing = false;

        if (i >= queue.length) {
          complete();
        } else {
          playCurrent();
        }
      },
      update
    });
  };

  playCurrent();

  return {
    add: (...actions) => {
      queue.push(...actions);

      playCurrent();
    },
    stop: () => {
      if (current != null) {
        current.stop();
      }
    }
  };
});

const workingInATeamChapter = createChapter('Working in a Team', {
  sections: [
    new ChapterText(() => (
      <Fragment>
        Most of the time, when working on a project, we work in teams. This means we need to exchange our files, for example by using a <Tooltip name="cloud">cloud</Tooltip>.  Let’s take a closer look on a project with one file and two users.
      </Fragment>
    )),
    new ChapterText(() => (
      <Fragment>
       User A starts by editing a file on his computer. He or she adds a few changes to it and then uploads the file to the cloud.
      </Fragment>
    )),
    new ChapterText(() => (
      <Fragment>
        Once uploaded a second user, user B wants to work on the file too. He or she downloads the file, add some changes. Than, he uploads the file again.
      </Fragment>
    )),
    new ChapterText(() => (
      <em>This goes on and on and on…</em>
    )),
    new ChapterText(() => (
      <Fragment>
        Sounds easy right? Basically it is. There are some problems though. Both users need to wait until the other one has finished editing the file. Otherwise changes from another user can get lost easily. Versioning to the rescue …
      </Fragment>
    )),
  ],
  [init]() {
    this.vis = new Visualisation();

    this.visUserA = new VisualisationArea('User A');
    this.visCloud = new VisualisationArea('Cloud');
    this.visCloud.column = 1;
    this.visUserB = new VisualisationArea('User B');
    this.visUserB.column = 2;

    this.visFile = new FileVisualisation();
    this.visUserFileA = new FileVisualisation();
    this.visCloudFile = new FileVisualisation();
    this.visUserFileB = new FileVisualisation();

    this.downloadToUserA = popmotionAction(({ complete }) => {
      this.visUserA.add(this.visFile);
      complete();
    });

    this.downloadToUserB = popmotionAction(({ complete }) => {
      this.visUserB.add(this.visFile);
      complete();
    });

    this.modify = popmotionAction(({ complete }) => {
      this.visFile.modify();
      complete();
    });

    this.uploadData = popmotionAction(({ complete }) => {
      this.visCloud.add(this.visFile);
      complete();
    });

    this.storeCloudFile = popmotionAction(({ complete }) => {
      this.visCloud.add(this.visCloudFile);
      complete();
    });

    this.storeUserBFile = popmotionAction(({ complete }) => {
      this.visUserB.add(this.visUserFileB);
      complete();
    });

    this.actionQueue = actionQueue().start();
  },
  [readOn]() {
    if (!this.userA) {
      this.vis.add(this.visUserA);
      this.vis.add(this.visCloud);
      this.vis.add(this.visUserB);

      this.visUserA.add(this.visFile);
      this.visUserA.add(this.visUserFileA);
      this.visUserA.add(this.visCloudFile);

      this.userA = true;
    } else if(!this.firstUpload) {
      this.firstUpload = true;

      this.actionQueue.add(
        delay(1000),
        this.modify,
        delay(2000),
        this.uploadData,
        this.storeCloudFile,
        delay(1000),
      );
    } else if (!this.userB) {
      this.userB = true;

      this.actionQueue.add(
        delay(1000),
        this.downloadToUserB,
        delay(2000),
        this.modify,
        this.storeUserBFile,
        delay(2000),
        this.uploadData,
        delay(1000),
      );
    } else if (!this.loop) {
      this.loop = true;

      this.actionQueue.add(
        loop(
          delay(1000),
          this.downloadToUserA,
          delay(2000),
          this.modify,
          delay(2000),
          this.uploadData,
          delay(2000),
          this.downloadToUserB,
          delay(2000),
          this.modify,
          delay(2000),
          this.uploadData,
          delay(1000),
        ),
      );
    }
  },
});

export default workingInATeamChapter;
