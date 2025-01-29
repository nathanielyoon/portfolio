import { createSignal, For, Show } from "solid-js";

export default () => {
  const correct = "acbbddabacdc".split("");
  const [input, set_input] = createSignal("");
  const answers = () => input().split("");
  const ok = () =>
    answers().every((pick) => "abcd".includes(pick)) && answers().length === 12;
  return (
    <main class="container flex flex-col py-8 gap-8">
      <input
        value={input()}
        oninput={({ target }) => set_input(target.value)}
        class="border border-black px-3 py-2"
        classList={{
          "bg-red-200": !ok(),
        }}
        autofocus
      />
      <div class="grid grid-cols-3 w-max gap-1 text-2xl">
        <table class="w-max text-center">
          <thead>
            <tr>
              <th>#</th>
              <th>Your answer</th>
            </tr>
          </thead>
          <tbody>
            <For each={correct}>
              {(letter, index) => (
                <tr class="border border-black">
                  <td class="py-2">{index() + 1}</td>
                  <td class="py-2 px-3">{letter.toUpperCase()}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <table class="w-max text-center">
          <thead>
            <tr>
              <th>#</th>
              <th>Your answer</th>
            </tr>
          </thead>
          <tbody>
            <For each={answers()}>
              {(letter, index) => (
                <tr
                  class="border border-black"
                  classList={ok()
                    ? {
                      "bg-red-200 font-bold": letter !== correct[index()],
                    }
                    : {}}
                >
                  <td class="py-2">{index() + 1}</td>
                  <td class="py-2 px-3">
                    {letter.toUpperCase()}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <strong class="text-9xl w-full h-full flex items-center justify-center">
          <Show when={ok()}>
            {answers().filter((answer, index) => correct[index] !== answer).length * 2}
          </Show>
        </strong>
      </div>
    </main>
  );
};
