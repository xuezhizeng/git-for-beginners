import React, { Component, Fragment } from 'react';
import { observer } from 'mobx-react';

import Chapter, {
  ChapterMain,
} from './Chapter';
import { CHAPTER_INTRODUCTION } from '../constants';
import ChapterHeader from './ChapterHeader';
import ChapterNext from './ChapterNext';
import ChapterBody from './ChapterBody';
import { TextSection } from '../models/Section';

const SECTIONS = [
  new TextSection(
    'Over the passed decades computer in different shape and sizes changed our daily life enormously. Together we create huge amount of data in form of files everyday to store everything from invoices to love letters, from code to illustrations and designs.'
  ),
  new TextSection(
    <Fragment>
      To prevent data loss we create backups and use clouds to store files and share data with others. Two people working on the same file is often impossible though. And after all, data is lost, because we accidentily deleted an old file or have overwritten a file a college had changed a few minutes before. <strong>No matter how hard we work on file name conventions and how many channels we use to communicate in our team, mistakes are made.</strong>
    </Fragment>
  ),
  new TextSection(
    'But not everything is lost (pun intended). Special version control systems can help to store versions of our project more effectily and give our team a better way of working on files together.'
  ),
  new TextSection(
    <strong>Welcome to “Git for Beginners” – an interactive tutorial to learn and understand Git, a popular version control system to help you and your team to not loose data again.</strong>
  ),
  new TextSection(
    'But let’s start by taking a look at …'
  ),
];

@observer
class IntroductionChapter extends Component {
  static chapter = CHAPTER_INTRODUCTION;

  render() {
    const { index, chapter, tutorial } = this.props;

    return (
      <Chapter>
        <ChapterMain>
          <ChapterHeader index={index} tutorial={tutorial} chapter={chapter} />
          <ChapterBody chapter={chapter} sections={SECTIONS} />
        </ChapterMain>
        <ChapterNext tutorial={tutorial} chapter={chapter} />
      </Chapter>
    );
  }
}

export default IntroductionChapter;

