
import React from 'react'
import XSidebar from './common/XSidebar.jsx'
import * as Table from 'reactabular-table';
import {Button, IconButton } from 'react-toolbox/lib/button';
import { Snackbar } from 'react-toolbox/lib/snackbar';
import lib from './common/lib.js'

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import Page from './Page.jsx'
import DragAndDropTable from './PageCompetitorList/competitors.jsx';
import style from './style.css';

// competition/:competition_id/competitorlist
class CompetitorsList extends React.Component {

 render() {
  return (
    <Page ref="page">
      <div id={style.titleContainer}>
        <h1>Competitors/h1>
        <div id={style.buttonsContainer}>
          <div id={style.saveChanges}>Save Changes</div>
          <div id={style.cancelChanges}>Cancel</div>
        </div>
      </div>
      <div id={style.dragAndDropWrapper}>
        <div id={style.dragAndDropWrapperTopBar}>
          <div id={style.dragAndDropTitle}>Rounds</div>
          <div id={style.dragAndDropAutosort}>
            <div>Autosort</div>
          </div>
        </div>
        <div id={style.dragAndDropTableScroller}>
          <DragAndDropTable />
        </div>
      </div>
    </Page>
  );
 }
}

export default DragDropContext(HTML5Backend)(CompetitorsList);


