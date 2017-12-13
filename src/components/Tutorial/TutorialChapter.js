import React, { PureComponent } from 'react';
import { inject } from 'mobx-react';
import { action } from 'mobx';

import TutorialWrapper from './TutorialWrapper';
import ChapterTransitionGroup from './Chapter/ChapterTransitionGroup';
import Navigation from './Navigation';

@inject('tutorial')
class TutorialChapter extends PureComponent {
  componentWillMount() {
    this.navigate();
  }

  componentWillReceiveProps(nextProps) {
    this.navigate(nextProps);
  }

  @action navigate(props = this.props) {
    const { tutorial, match } = props;
    const chapterIndex = parseInt(match.params.chapterIndex, 10);

    tutorial.currentChapterIndex = chapterIndex;
  }

  render() {
    const { tutorial, match } = this.props;
    const { currentChapter: chapter } = tutorial;

    if (chapter == null) {
      return null;
    }

    return (
      <TutorialWrapper>
        <Navigation />
        <ChapterTransitionGroup match={match}>
          {/* We pass the current chapter to the component to be able to switch between multiple
              chapter components via transitions */}
          <chapter.component key={chapter.index} chapter={chapter} />
        </ChapterTransitionGroup>
      </TutorialWrapper>
    );
  }
}

export default TutorialChapter;