import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from './App';
import Authorization from './Authorization.jsx'

/** All the routes */
import LoginPage            from '../PageLogin.jsx'
import HomePage             from '../PageHome.jsx'
import CompetitionListPage  from '../PageCompetitionList.jsx'
import CompetitionListAdmin from '../PageCompetitionListAdmin.jsx'
import CompetitionPage      from '../PageCompetition.jsx'
import EventRegistration    from '../PageEventRegistration.jsx'
import EditSchedule         from '../PageEditSchedule.jsx'
import RunCompetition       from '../PageRunCompetition.jsx'
import CompetitionHomeAdmin from '../PageCompetitionHomeAdmin.jsx'
import CompetitorsList      from '../PageCompetitorList.jsx'
import EditProfile          from '../PageEditProfile.jsx'
import EnterCallbacks       from '../PageEnterCallbacks.jsx'
import EditCompetition      from '../PageEditCompetition.jsx'
import EditOfficials        from '../PageEditOfficials.jsx'
import EditLevelsAndStyles  from '../PageEditLevelsAndStyles.jsx'
import EditEvents           from '../PageEditEvents.jsx'
import SeeCompetitor        from '../PageSeeCompetitor.jsx'
import RegisterCompetitor   from '../PageRegisterCompetitor.jsx'
import OrganizationPayment  from '../PageOrganizationPayment.jsx'
import PageNewUser          from '../PageNewUser.jsx'
import CompetitorPayment    from '../PageCompetitorPayment.jsx'

/**
 * Semantics:
 *   User pages can be accessed by 'user', 'judge' and 'admin'
 *   Judge pages can be accessed by 'judge' and 'admin'
 *   Admin pages can be accessed by 'admin'
 */
const Any   = Authorization(Authorization.ALL)
const User  = Authorization(['user', 'judge', 'admin'])
const Judge = Authorization(['judge', 'admin'])
const Admin = Authorization(['admin'])

const routes = {
  '/home'                                                       : Any(HomePage),
  '/competition/:competition_id/eventregistration'              : User(EventRegistration),
  '/competitions'                                               : User(CompetitionListPage),
  '/editprofile'                                                : User(EditProfile),
  '/competition/:competition_id/run'                            : Judge(RunCompetition),
  '/competition/:competition_id/round/:round_id/entercallbacks' : Judge(EnterCallbacks),
  '/competition/:competition_id/editschedule'                   : Admin(EditSchedule),
  '/competition/:competition_id/editlevelsandstyles'            : Admin(EditLevelsAndStyles),
  '/competition/:competition_id/editevents'                     : Admin(EditEvents),
  '/competition/:competition_id/competitorslist'                : Admin(CompetitorsList),
  '/competition/:competition_id/seecompetitor/:competitor_id'   : Admin(SeeCompetitor),
  '/competition/:competition_id/regcompetitor/:competitor_id'   : Admin(RegisterCompetitor),
  '/competition/:competition_id/:competitor_id'                 : User(CompetitionPage),
  '/admin/competitions'                                         : User(CompetitionListAdmin),
  '/admin/competition/:competition_id'                          : Admin(CompetitionHomeAdmin),
  '/editcompetition/:competition_id'                            : Admin(EditCompetition),
  '/editofficials/:competition_id'                              : Admin(EditOfficials),
  '/newuser'                                                    : User(PageNewUser),
  '/organizationpayment/:competition_id/:organization_id'       : Admin(OrganizationPayment),
  '/competitorpayment/:competition_id/:competitor_id'           : User(CompetitorPayment),
}

export default (
  <Route path="/" component = {App}>
    <IndexRoute component = {Any(LoginPage)} />
    { Object.keys(routes)
      .map((route, i) => <Route key = {i} path = {route} component = {routes[route]} />) }
  </Route>
);
