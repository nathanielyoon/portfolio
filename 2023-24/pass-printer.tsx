import { type Component, createMemo, createSignal, For, Show } from "solid-js";

const Section =
  ((props) => (
    <section class={`flex flex-col gap-0.5 ${props.class ?? ""}`}>
      <header>{props.title}</header>
      <p class="border-2 border-black p-1 print_border-2 print_border-black min-h-[36px]">
        {props.content}
      </p>
    </section>
  )) satisfies Component<{ title: string; content: string; class?: string }>;
const Document: Component<{ fields: string[] }> = (props) => (
  <article class="flex flex-col gap-2 items-stretch">
    <Section title="Student Name" content={props.fields[0]} />
    <Section title="Class" content={props.fields[1]} />
    <Section title="Teacher" content="Yoon" />
    <div class="grid grid-cols-3">
      <Section title="Period" content={props.fields[3]} class="h-full" />
      <Section
        title="Anticipated Date of Assessment"
        content={props.fields[2]}
        class="col-span-2 h-full"
      />
    </div>
    <Section
      title="Assessment/Assignment Name and Format"
      content={props.fields[4]}
    />
    <Section
      title="Special instructions (e.g. small group, audio, timing, etc.)"
      content={props.fields[6]}
    />
    <section class="flex flex-col gap-2 mt-4">
      <p>For TLC Staff:</p>
      <p>Time started ___________ Time finished ___________</p>
    </section>
  </article>
);
export default () => {
  const [raw, set_raw] = createSignal("");
  const rows = () =>
    raw().split("\n").filter(Boolean).map((row) => row.split("\t"));
  const [include, set_include] = createSignal(0);
  const included = createMemo(() => {
    let ok = rows().filter((_, index) => include() & 1 << index), z = 0;
    const to = ok.length - ok.length % 2, z: [string[], string[]?][] = [];
    while (z < to) z.push([ok[z++], ok[z++]]);
    return (ok.length % 2 && z.push([ok[z]]), z);
  });
  return (
    <main class="px-4 py-8 flex flex-col gap-8">
      <section class="flex flex-col gap-2 print_hidden">
        <textarea
          oninput={({ target }) => set_raw(target.value)}
          class="border border-black h-32"
        >
          {raw()}
        </textarea>
        <button
          class="border border-black py-1 px-1.5 transition duration-75 cursor-pointer disabled_opacity-50 disabled_cursor-default enabled_bg-black enabled_text-white flex items-center gap-1 justify-center"
          onclick={() => window.print()}
          disabled={!included().length}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" />
          </svg>
          Print {included().length} page{included().length !== 1 && "s"}
        </button>
        <Show when={rows().length}>
          <table>
            <thead>
              <tr class="font-normal border-b border-black">
                <th>?</th>
                <th class="text-left">Student</th>
                <th class="text-left">Date</th>
                <th class="text-left">Assessment</th>
              </tr>
            </thead>
            <tbody>
              <For each={rows()}>
                {(row, index) => (
                  <tr class="border-b border-gray-500">
                    <td class="text-center">
                      <input
                        class="w-5 h-5 mt-1"
                        type="checkbox"
                        name={row[0]}
                        value="include"
                        oninput={({ target }) =>
                          set_include((was) =>
                            target.checked
                              ? was | 1 << index()
                              : was & ~(1 << index())
                          )}
                      />
                    </td>
                    <th scope="row" class="font-normal text-left">{row[0]}</th>
                    <td>{row[2]}</td>
                    <td>{row[4]}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </section>
      <For each={included()}>
        {(rows) => (
          <section class="grid grid-cols-2 gap-16 print_break-after-page">
            <Document fields={rows[0]} />
            <Show when={rows[1]}>{(also) => <Document fields={also()} />}</Show>
          </section>
        )}
      </For>
    </main>
  );
};
