const pool = require('./api/db');
const SQL = require('sql-template-strings')

//     //to run a query we just pass it to the pool
//     //after we're done nothing has to be taken care of
//     //we don't have to return any client to the pool or close a connection

const rollback = (client, done) => {
    client.query('ROLLBACK', (err) => {
        return done(err);
    });
}

const get_num_couples_per_event_for_competition = cid => {
    return pool.query(SQL`SELECT COUNT(p.number), e.id
        FROM partnership p
        LEFT JOIN event e ON (e.id = p.eventid)
        WHERE p.competitionid = ${cid}
        GROUP BY e.id`);
}

const create_rounds_for_events_for_competition = cid => {
    return new Promise(function(resolve, reject) {
       get_num_couples_per_event_for_competition(cid).then(value => {
          pool.connect(function(err, client, done) {
              if (err) {
                  console.error('error getting client', err);
                  reject(err);
              } else {
                  client.query('BEGIN', (err) => {
                      if (err) {
                          rollback(client, done);
                          return reject(err);
                      }
                      let ordernumber = 1;
                      for (let row of value) {
                          let couples = parseInt(row.count);
                          let eventid = row.id;
                          let numRounds = Math.ceil(couples / 7.0);
                          let nextRound = null;
                          for (let i = numRounds; i >= 1; i++) {
                              let size = Math.min(couples, (numRounds - i + 1) * 7);
                              if (i == numRounds) {
                                  client.query(SQL`INSERT INTO round (eventid, name, ordernumber, size) VALUES (${eventid}, 'Final', ${ordernumber}, ${size}) RETURNING id`, (err, result) => {
                                      if (err) {
                                          rollback(client, done);
                                          return reject(err);
                                      }
                                      nextRound = result.rows[0].id;
                                  });
                              } else if (i == numRounds - 1) {
                                  client.query(SQL`INSERT INTO round (eventid, name, ordernumber, size, nextround) VALUES (${eventid}, 'Semifinal', ${ordernumber}, ${size}, ${nextround}) RETURNING id`, (err, result) => {
                                      if (err) {
                                          rollback(client, done);
                                          return reject(err);
                                      }
                                      nextRound = result.rows[0].id;
                                  });
                              } else if (i == numRounds - 2) {
                                  client.query(SQL`INSERT INTO round (eventid, name, ordernumber, size) VALUES (${eventid}, 'Quarter', ${ordernumber}, ${size}, ${nextround}) RETURNING id`, (err, result) => {
                                      if (err) {
                                          rollback(client, done);
                                          return reject(err);
                                      }
                                      nextRound = result.rows[0].id;
                                  });
                              } else {
                                  const name = 'Round ' + i;
                                  client.query(SQL`INSERT INTO round (eventid, name, ordernumber, size) VALUES (${eventid}, ${name}, ${ordernumber}, ${size}, ${nextround}) RETURNING id`, (err, result) => {
                                      if (err) {
                                          rollback(client, done);
                                          return reject(err);
                                      }
                                      nextRound = result.rows[0].id;
                                  });
                              }
                              ordernumber++;
                          }
                      }
                      client.query('COMMIT', (err) => {
                          if (err) {
                              rollback(client, done);
                              return reject(err);
                          }
                          done(null);
                          resolve("{finished: true}");
                      });
                  });
              }
          })
       });
    });
}

const update_events_for_competition = data => {
    return new Promise(function(resolve, reject) {
        pool.connect(function(err, client, done) {
           if (err) {
               console.error('error getting client', err);
               reject(err);
           } else {
               client.query('BEGIN', (err) => {
                   if (err) {
                       rollback(client, done);
                       return reject(err);
                   }
                   client.query(SQL`CREATE TEMPORARY TABLE newevents (
                        id integer,
                        styleid integer,
                        stylename character varying(30),
                        levelid integer,
                        levelname character varying(30),
                        dance character varying(30),
                        ordernumber integer
                        ) ON COMMIT DROP`, (err, result) => {
                       if (err) {
                           rollback(client, done);
                           return reject(err);
                       }
                   });
                   for (let row of data.rows) {
                       client.query(SQL`INSERT INTO newevents (id, stylename, levelname, dance, ordernumber) VALUES (${row.id}, ${row.style}, ${row.level}, ${row.dance}, ${row.ordernumber})`, (err, result) => {
                           if (err) {
                               rollback(client, done);
                               return reject(err);
                           }
                       });
                   }
                   client.query(SQL`UPDATE newevents SET styleid = s.id FROM style s WHERE newevents.stylename = s.name AND s.competitionid = ${data.cid}`, (err, result) => {
                       if (err) {
                           console.log(err);
                           rollback(client, done);
                           return reject(err);
                       }
                   });
                   client.query(SQL`UPDATE newevents SET levelid = l.id FROM level l WHERE newevents.levelname = l.name AND l.competitionid = ${data.cid}`, (err, result) => {
                       if (err) {
                           rollback(client, done);
                           return reject(err);
                       }
                   });
                   client.query(SQL`DELETE FROM event WHERE id NOT IN 
                    (SELECT id FROM newevents)`, (err, result) => {
                       if (err) {
                           rollback(client, done);
                           return reject(err);
                       }
                   });
                   client.query(SQL`UPDATE event e SET ordernumber = n.ordernumber FROM newevents n
                    WHERE e.id = n.id`, (err, result) => {
                       if (err) {
                           rollback(client, done);
                           return reject(err);
                       }
                   });
                   client.query(SQL`INSERT INTO event (competitionid, styleid, levelid, dance, ordernumber)
                    SELECT ${data.cid} AS competitionid, styleid, levelid, dance, ordernumber
                    FROM newevents
                    WHERE id = NULL`, (err, result) => {
                       if (err) {
                           rollback(client, done);
                           return reject(err);
                       }
                   });
                   client.query('COMMIT', (err) => {
                       if (err) {
                           rollback(client, done);
                           return reject(err);
                       }
                       done(null);
                       resolve("{finished: true}");
                   });
               });
           }
        });
    });
}

const update_competition_info = data => {
    return pool.query(SQL`UPDATE competition SET name = ${data.name}, leadidstartnum = ${data.leadidstartnum},
        locationname = ${data.locationname}, earlyprice = ${data.earlyprice}, regularprice = ${data.regularprice},
        lateprice = ${data.lateprice}, startdate = ${data.startdate}, enddate = ${data.enddate}, 
        regstartdate = ${data.regstartdate}, earlyregdeadline = ${data.earlyregdeadline}, 
        regularregdeadline = ${data.regularregdeadline}, lateregdeadline = ${data.lateregdeadline},
        description = ${data.description} WHERE id = ${data.cid}`);
}

const update_competition_current_event_id = data => {
    return pool.query(SQL`UPDATE competition SET currenteventid = ${data.currenteventid} WHERE id = ${data.cid}`);
}

const get_all_admins = () => {
    return pool.query('SELECT * FROM admin', []);
}

const get_judges_for_competition = (comp_id) => {
    return pool.query(SQL`SELECT * FROM judge WHERE competitionid = ${comp_id}`);
}

const get_judge = id => {
    return pool.query(SQL`SELECT * FROM judge WHERE id = ${id}`);
}

const get_affiliations = () => {
    return pool.query('SELECT * FROM affiliation', []);
}

const get_competitions = () => {
    return pool.query('SELECT * FROM competition', []);
}

const get_levels_for_competition = cid => {
    return pool.query(SQL`SELECT id, name, ordernumber FROM level WHERE competitionid = ${cid}`);
}

const get_styles_for_competition = cid => {
    return pool.query(SQL`SELECT id, name, ordernumber FROM style WHERE competitionid = ${cid}`);
}

const get_competition_info = cid => {
    return pool.query(SQL`SELECT * FROM competition WHERE id = ${cid}`);
}

const get_events_for_competition = cid => {
    return pool.query(SQL`SELECT style.name, level.name, dance, event.ordernumber FROM event  
        LEFT JOIN style ON (style.id = event.styleid) 
        LEFT JOIN level ON (level.id = event.levelid)
        WHERE event.competitionid = ${cid} ORDER BY ordernumber`);
}

const get_rounds_for_competition = cid => {
    return pool.query(SQL`SELECT r.id, e.levelid, e.styleid, e.dance, r.name, r.ordernumber, r.size, r.nextround, 
        r.judgeid1, r.judgeid2, r.judgeid3, r.judgeid4, r.judgeid5, r.judgeid6 FROM event e
        LEFT JOIN round r ON (e.id = r.eventid) WHERE e.competitionid = ${cid} ORDER BY r.ordernumber`);
}

const get_competitors_for_competition = cid => {
    return pool.query(SQL`SELECT DISTINCT ON (id) c.id, firstname || ' ' || lastname as name, email, 
        CASE WHEN c.id = p.leadcompetitorid THEN p.number ELSE NULL END as number, a.name as affiliationname, 
        pr.paidwithaffiliation, pr.amount FROM competitor c 
        LEFT JOIN partnership p ON (c.id = p.leadcompetitorid OR c.id = p.followcompetitorid) 
        LEFT JOIN paymentrecord pr ON (c.id = pr.competitorid) 
        LEFT JOIN  affiliation a ON (c.affiliationid = a.id) 
        WHERE p.competitionid = ${cid}`);
}

const get_affiliations_for_competition = cid => {
    return pool.query(SQL`SELECT DISTINCT ON (affiliationname) a.name as affiliationname
        FROM competitor c 
        LEFT JOIN partnership p ON (c.id = p.leadcompetitorid OR c.id = p.followcompetitorid)
        LEFT JOIN  affiliation a ON (c.affiliationid = a.id) 
        WHERE p.competitionid = ${cid}`);
}

const get_num_competitors_per_style_for_competition = cid => {
    return pool.query(SQL`SELECT COUNT(c.id), s.name
        FROM competitor c 
        LEFT JOIN partnership p ON (c.id = p.leadcompetitorid OR c.id = p.followcompetitorid)
        LEFT JOIN event e ON (e.id = p.eventid)
        LEFT JOIN style s ON (e.styleid = s.id)
        WHERE p.competitionid = ${cid}
        GROUP BY s.name`)
}

const add_new_judge = (judge) => {
    return pool.query(SQL`INSERT INTO judge (email, token, firstname, lastname, phonenumber, competitionid) 
        VALUES (${judge.email}, ${judge.token}, ${judge.firstName}, ${judge.lastName}, ${judge.phoneNumber}, ${judge.competitionId})`);
}

// INSERT

// DELETE

module.exports = {
    get_all_admins,
    get_judges_for_competition,
    get_judge,
    get_affiliations,
    get_competitions,
    get_levels_for_competition,
    get_styles_for_competition,
    get_competition_info,
    get_events_for_competition,
    get_rounds_for_competition,
    get_competitors_for_competition,
    get_affiliations_for_competition,
    get_num_competitors_per_style_for_competition,
    add_new_judge,
    create_rounds_for_events_for_competition,
    update_events_for_competition,
    update_competition_info,
    update_competition_current_event_id
}
