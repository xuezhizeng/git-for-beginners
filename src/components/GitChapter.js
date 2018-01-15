import React, { Component, Fragment } from 'react';
import { observer } from 'mobx-react';
import { extendObservable } from 'mobx';

import { ChapterText } from '../models/ChapterSection';
import TutorialChapter from './TutorialChapter';
import VisualisationArea from './VisualisationArea';
import VisualisationAreaName from './VisualisationAreaName';
import Visualisation from './Visualisation';
import Tooltip from './Tooltip';

const SECTIONS = [
  new ChapterText(
    () => (
      <Fragment>
        Git is a version control system. It’s a software you can install on your computer to store <Tooltip name="version">versions</Tooltip> of your file. But instead of copying files and folders by hand, you store new snapshots of your whole project.'
      </Fragment>
    ),
    { skip: true }
  ),
  new ChapterText(() => 'Let’s take a look at the different parts of Git.'),
  new ChapterText(
    () => 'First, there is the Working Directory, the folder on your computer where all the files and folders of your project are stored in. Here you add, modify or delete files with other software like you are used to.'
  ),
  new ChapterText(
    () => 'First, there is the Working Directory, the folder on your computer where all the files and folders of your project are stored in. Here you add, modify or delete files with other software like you are used to.'
  ),
  new ChapterText(
    () => 'First, there is the Working Directory, the folder on your computer where all the files and folders of your project are stored in. Here you add, modify or delete files with other software like you are used to.'
  ),
];

@observer
class GitChapter extends Component {
  constructor(props) {
    super();

    const { chapter } = props;

    extendObservable(chapter, {
      get hasWorkingDirectory() {
        return this.visibleTextSections > 1;
      },
      get hasStagingArea() {
        return this.visibleTextSections > 2;
      },
      get hasRepository() {
        return this.visibleTextSections > 3;
      },
    });
  }

  renderVisualisation() {
    const { chapter, fontRegularCaps } = this.props;

    console.log(chapter.visibleTextSections);

    return (
      <Visualisation vis={chapter.vis}>
        {chapter.hasWorkingDirectory && <VisualisationArea column={0} height={1}>
          <VisualisationAreaName font={fontRegularCaps} name="Working Directory" />
        </VisualisationArea>}

        {chapter.hasStagingArea && <VisualisationArea column={1} height={1}>
          <VisualisationAreaName font={fontRegularCaps} name="Staging Area" />
        </VisualisationArea>}

        {chapter.hasRepository && <VisualisationArea column={2} height={10} width={4}>
          <VisualisationAreaName font={fontRegularCaps} name="Repository" />
        </VisualisationArea>}
      </Visualisation>
    );
  }

  render() {
    const { chapter, tutorial } = this.props;



    return (
      <TutorialChapter tutorial={tutorial} chapter={chapter} sections={SECTIONS}>
        {this.renderVisualisation()}
      </TutorialChapter>
    );
  }
}

export default GitChapter;
