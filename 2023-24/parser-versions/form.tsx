import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js";
import { Texter } from "./components/texter.tsx";
import { b91_u } from "./lib/base/91.ts";
import { no } from "./lib/base/text.ts";
import { Parser } from "./lib/data/parser.ts";

export const Parserer = () => {
  const [a, b] = createSignal("");
  const c = createMemo(() => {
    try {
      switch (a().trim()[0]) {
        case "!":
          return Parser.from_binary(b91_u(a()));
        case "{":
          return Parser.from_json(a());
        case "^":
          return Parser.from_regex(a());
        default:
          return no(
            "First character \"!\" (binary), \"{\" (JSON), or \"^\" (regex)",
            a().trim()[0],
          );
      }
    } catch (a) {
      return a instanceof Error ? a : Error(String(a));
    }
  });
  const d = createMemo(() => c() instanceof Error ? null : c() as Parser);
  return <>
    <Texter get={a} set={b} />
    <output>
      {c() instanceof Error
        ? c().toString().replace(" ", "\n")
        : c().toString()}
    </output>
    <Show when={d()}>
      {B =>
        <>
          <For each={B().parts}>
            {C =>
              <label style={{ display: "flex", "flex-direction": "column" }}>
                {C[0]}
                <Switch>
                  <Match when={C[1] === 0}>
                    <input minlength="52" maxlength="52" />
                  </Match>
                  <Match when={C[1] === 1}>
                    <input inputmode="numeric" />
                  </Match>
                  <Match when={C[1] === 2}>
                    <input inputmode="decimal" />
                  </Match>
                  <Match when={C[1] === 3 && C}>
                    {D => <input minlength={D()[2]} maxlength={D()[3]} />}
                  </Match>
                  <Match when={C[1] === 4 && C}>
                    {D =>
                      <For each={[...Array(D()[3]).keys()]}>
                        {E =>
                          <select>
                            <option disabled selected value="">
                              Select one{E >= D()[2] && " (optional)"}
                            </option>
                            <For each={D()[4]}>
                              {F => <option value={F}>{F}</option>}
                            </For>
                          </select>}
                      </For>}
                  </Match>
                  <Match when={C[1] === 5 && C}>
                    {D =>
                      <For each={D()[2]}>
                        {E =>
                          <label
                            style={{
                              display: "flex",
                              "align-items": "center",
                              gap: "0.25rem",
                            }}
                          >
                            <input type="checkbox" />
                            {E}
                          </label>}
                      </For>}
                  </Match>
                  <Match when={C[1] === 6 && C}>
                    {D =>
                      <select>
                        <option disabled selected value="">Select one</option>
                        <For each={D()[2]}>
                          {E => <option value={E}>{E}</option>}
                        </For>
                      </select>}
                  </Match>
                </Switch>
              </label>}
          </For>
        </>}
    </Show>
  </>;
};
