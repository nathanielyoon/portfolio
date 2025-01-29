import type { RouteDataFuncArgs } from "@solidjs/router";
import { createResource } from "solid-js";
import { de, en, type G, type It } from "./regex";
import tsv from "./tsv";

const enmatch = en(
  /^(?<gov>[-\w]{12})\t(?<opp>[-\w]{12})\t(?<judges>[-\w]{6}(?: [-\w]{6}){0,14})\t{1,14}(?<room>[-\w ]{1,63})\t{1,8}(?:(?<ballot>[-\w]{86})|(?<result>[-\w]{1,39}))?$/,
  {
    gov: "",
    opp: "",
    judges: (a) => a?.split(" ") ?? [],
    room: "",
    ballot: undefined,
    result: undefined,
  },
);
const enround = en(
  /^### (?<number>(?:\d| )\d)(?: (?<roundname>[ -~]{1,63}))?\n\ngov\t\topp\t\tjudges\t{1,14}room\t{1,8}(?:ballot|result)(?<matches>(?:[-\w \t\n]+){0,511})/,
  {
    number: Number,
    roundname: undefined,
    matches: (a) => {
      const b = a?.split("\n").filter(Boolean) ?? [];
      const Z = b.length, c = Array<It<typeof enmatch>>(Z);
      for (let z = 0; z < Z; ++z) c[z] = enmatch(b[z]);
      return c;
    },
  },
);
const deround = de<typeof enround>`### ${{
  number: (a) => String(a).padStart(2),
}}${{ roundname: (a) => a === undefined ? "" : " " + a }}

${{
  matches: (a) => {
    const Z = a.length;
    if (!Z) return "gov\t\topp\t\tjudges\troom\tballot";
    const b = Array(Z), d = a[0].result === undefined;
    for (let z = 0, e; z < Z; ++z) {
      if (d !== ((e = a[z]).result === undefined)) {
        throw Error("400", {
          cause: `Wanted:\n${
            d
              ? '"ballot": /^[-\\w]{86}$/,\n"result": undefined'
              : '"ballot": undefined,\n"result": /^[-\\w]{1,39}$/'
          }\n\nGot:\n${e}`,
        }); // @ts-expect-error
      } else (b[z] = e).judges = e.judges.join(" ");
    }
    return tsv(["gov", "opp", "judges", "room", d ? "ballot" : "result"], b);
  },
}}`;

const engroup = (a: string) => {
  const b = exec<"type" | "groupname" | "rounds">(
    /^## (?<type>\d) (?<groupname>[ -~]{1,63})\n\n(?<rounds>(?:### (?:\d| )\d(?: [ -~]{1,63})?[-\w \t\n]+?\n\n(?=#|$)){0,99})$/,
    a,
  );
  const c = b.rounds.match(
    /^### \d\d(?: [ -~]{1,64})?\n\n[-\w\t\n]+?\n\n(?=#|$)/gms,
  )!;
  const Z = c.length, d = Array<ReturnType<typeof enround>>(Z);
  for (let z = 0; z < Z; ++z) d[z] = enround(c[z]);
  return { type: Number(b.type), groupname: b.groupname, rounds: d };
};
const degroup: S<typeof engroup> = (a) => {
  let b = `## ${a.type} ${a.groupname}\n\n`, Z = a.rounds.length, c = Array(Z);
  for (let z = 0; z < Z; ++z) c[z] = deround(a.rounds[z]);
  return b + c.join("\n\n");
};
const enjudge = (a: string) => {
  const b = exec<"id" | "name" | "status" | "schools" | "availability">(
    /^(?<id>[-\w]{6})\t(?<name>[^\t]{1,255})\t{1,32}(?<status>\d{1,3})\t(?<schools>(?=[-A-Za-z. ]{1,511}\t)[-A-Za-z]{1,63}(?:[. ][-A-Za-z]{1,63})+)\t(?<availability>(?:\d| )\d(?: (?:\d| )\d){0,98})$/,
    a,
  );
  return {
    id: b.id,
    name: b.name,
    status: Number(b.status),
    schools: b.schools.split(" "),
    availability: b.availability.split(" "),
  };
};
const enjudges = (a: string) => {
  const b = a.split("\n").slice(4).filter(Boolean), Z = b.length;
  const c = Array<ReturnType<typeof enjudge>>(Z);
  for (let z = 0; z < Z; ++z) c[z] = enjudge(b[z]);
  return c;
};
const dejudges: S<typeof enjudges> = (a) => {
  let Z = a.length, b = Array(Z), c = "## Judges\n\n";
  if (Z === 0) return c + "id\tname\tstatus\tschools\tavailability";
  for (let z = 0, d; z < Z; ++z) {
    b[z] = {
      id: (d = a[z]).id,
      name: d.name,
      status: String(d.status),
      schools: d.schools.join(" "),
      availability: d.availability.join(" "),
    };
  }
  return c + tsv(["id", "name", "status", "schools", "availability"], b);
};
const endebater = (a: string) => {
  const b = exec<"id" | "name" | "status" | "schools" | "team">(
    /^(?<id>[-\w]{6})\t(?<name>[^\t]{1,255})\t{1,32}(?<status>\d{1,3})\t(?<schools>(?=[-A-Za-z. ]{1,511}\t)[-A-Za-z]{1,63}(?:[. ][-A-Za-z]{1,63})+)\t(?<team>[^\t]{1,255})$/,
    a,
  );
  return {
    id: b.id,
    name: b.name,
    status: Number(b.status),
    schools: b.schools.split(" "),
    team: b.team,
  };
};
const endebaters = (a: string) => {
  const b = a.split("\n").slice(4).filter(Boolean), Z = b.length;
  const c = Array<ReturnType<typeof endebater>>(Z);
  for (let z = 0; z < Z; ++z) c[z] = endebater(b[z]);
  return c;
};
const dedebaters: S<typeof endebaters> = (a) => {
  let Z = a.length, b = Array(Z), c = "## Debaters\n\n";
  if (Z === 0) return c + "id\tname\tstatus\tschools\tteam";
  for (let z = 0, d; z < Z; ++z) {
    b[z] = {
      id: (d = a[z]).id,
      name: d.name,
      status: String(d.status),
      schools: d.schools.join(" "),
      team: d.team,
    };
  }
  return c + tsv(["id", "name", "status", "schools", "team"], b);
};
const enpage = (a: string) => {
  const b = exec<"title" | "key" | "url" | "date" | "groups" | "index">(
    /^# (?<title>[ -~]{1,63})\n\n: (?<key>[-\w]{43})\n: (?<url>https:\/\/[!-;=?-~]{1,255})\n: (?<date>\d{4}-\d\d-\d\d \d\d:\d\d:\d\d[+-]\d\d:\d\d)\n\n(?<groups>(?:## \d [ -~]{1,63}\n\n[-\w \t\n]+?\n\n(?=## )){1,10})(?<index>## .+)$/s,
    a,
  );
  if (!URL.canParse(b.url)) throw Error("400", { cause: b.url });
  const c = b.groups.match(/^## \d [ -~]\n\n[-\w \t\n]+?\n\n(?=## )/g);
  if (!c) throw Error("400", { cause: c });
  let Z = c.length, d = Array<ReturnType<typeof engroup>>(Z), e;
  for (let z = 0; z < Z; ++z) d[z] = engroup(c[z]);
  if ((e = b.index.split("\n\n")).length < 4) throw Error("400", { cause: e });
  return {
    title: b.title,
    key: b.key,
    url: new URL(b.url),
    date: new Date(b.date),
    groups: d,
    judges: enjudges(e[1]),
    debaters: endebaters(e[3]),
  };
};
const depage: S<typeof enpage> = (a) => {
  const b = a.date.getTimezoneOffset(), c = b > 0 ? "-" : "+";
  const d = `${c}${pad(b / 60), "0"}:${pad(Math.abs(b % 60), "0")}`;
  const Z = a.groups.length, e = Array<string>(Z);
  for (let z = 0; z < Z; ++z) e[z] = degroup(a.groups[z]);
  return `# ${a.title}

: ${a.key}
: https://${a.url.hostname}${a.url.pathname}
: ${new Date(a.date.getTime() - b * 60000).toISOString().replace(/\..*/, d)}

${e.join("\n\n")}

${dejudges(a.judges)}

${dedebaters(a.debaters)}`;
};
export const get = ({ params, navigate }: RouteDataFuncArgs) =>
  createResource(() => params["key"], async (key) => {
    try {
      // const r = await fetch(`https://raw.tab.wiki/${key}`);
      const r = await fetch("/example.txt");
      if (!r.ok) throw r.status;
      return r.text();
    } catch (error) {
      let status = 500, cause = "";
      if (error instanceof Error) {
        status = parseInt(error.message) || 500;
        cause = typeof error.cause === "string" ? error.cause : error.message;
      } else if (typeof error === "number") status = error, cause = key;
      cause = encodeURIComponent(cause);
      return <never> navigate(`/?status=${status}&cause=${cause}`);
    }
  });
