import {
  convertMatchesObjectToArray, sortAllMatchesByTimeDescending
} from './services'

describe('testing services', () => {
  const dummyMatchesObj = {
    "match1": {
      _id: 1, _tid: 1, time: { time: "time", date: "date", uts: 1 },
      teams: { home: { name: "team1" }, away: { name: "team2" } }, result: { home: 1, away: 2 }, comment: ""
    },
    "match3": {
      _id: 3, _tid: 3, time: { time: "time", date: "date", uts: 3 },
      teams: { home: { name: "team1" }, away: { name: "team2" } }, result: { home: 1, away: 2 }, comment: ""
    },
    "match2": {
      _id: 2, _tid: 2, time: { time: "time", date: "date", uts: 2 },
      teams: { home: { name: "team1" }, away: { name: "team2" } }, result: { home: 1, away: 2 }, comment: ""
    },
  }

  const dummyMatchesArrUnsorted = [
    {
      _id: 1, _tid: 1, time: { time: "time", date: "date", uts: 1 },
      teams: { home: { name: "team1" }, away: { name: "team2" } }, result: { home: 1, away: 2 }, comment: ""
    },
    {
      _id: 3, _tid: 3, time: { time: "time", date: "date", uts: 3 },
      teams: { home: { name: "team1" }, away: { name: "team2" } }, result: { home: 1, away: 2 }, comment: ""
    },
    {
      _id: 2, _tid: 2, time: { time: "time", date: "date", uts: 2 },
      teams: { home: { name: "team1" }, away: { name: "team2" } }, result: { home: 1, away: 2 }, comment: ""
    },
  ]

  const dummyMatchesArrSorted = [
    {
      _id: 3, _tid: 3, time: { time: "time", date: "date", uts: 3 },
      teams: { home: { name: "team1" }, away: { name: "team2" } }, result: { home: 1, away: 2 }, comment: ""
    },
    {
      _id: 2, _tid: 2, time: { time: "time", date: "date", uts: 2 },
      teams: { home: { name: "team1" }, away: { name: "team2" } }, result: { home: 1, away: 2 }, comment: ""
    },
    {
      _id: 1, _tid: 1, time: { time: "time", date: "date", uts: 1 },
      teams: { home: { name: "team1" }, away: { name: "team2" } }, result: { home: 1, away: 2 }, comment: ""
    },
  ]

  it('converts Matches object values into Matches array', () => {
    expect(convertMatchesObjectToArray(dummyMatchesObj)).toStrictEqual(dummyMatchesArrUnsorted)
  })

  it('sorts Matches array by uts time descending', () => {
    expect(sortAllMatchesByTimeDescending(dummyMatchesArrUnsorted)).toStrictEqual(dummyMatchesArrSorted)
  })

})