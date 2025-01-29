// @refresh reload
import { Suspense, createSignal, For, children, createEffect, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { A, Body, ErrorBoundary, Head, Html, Meta, Scripts, Title, Link } from "solid-start";

const [hsl, set_hsl] = createSignal({
  hue: 0,
  saturation: 100,
  lightness: 75,
  opacity: 100
});
const color = values => `hsl(${values.hue} ${values.saturation}% ${values.lightness}% / ${values.opacity}%)`;
const other_values = (type, value) => ({...hsl(), [type]: value});
const background_gradient = type => `linear-gradient(to right, ${color(other_values(type, 0))}, ${color(other_values(type, 50))}, ${color(other_values(type, 100))})`;
const full_gradient = () => `linear-gradient(to right, ${[...Array(36).keys()].map(value => `${color({...hsl(), hue: value * 10})} ${Math.floor(value / 36 * 100)}%`).join(", ")})`;

const Favicon = (props) => {
  const [grid, set_grid] = createSignal(false);
  const [box, set_box] = createSignal(true);
  const [stroke, set_stroke] = createSignal(1);
  const recovered_paths = JSON.parse(window.localStorage.getItem("saved_paths") || "{}");
  const [paths, set_paths] = createSignal(Object.fromEntries(Object.entries(recovered_paths).map(([key, value]) => {
    const [path, set_path] = createSignal(value);
    createEffect(() => {
      const saved_paths = JSON.parse(window.localStorage.getItem("saved_paths") || "{}");
      saved_paths[key] = path();
      window.localStorage.setItem("saved_paths", JSON.stringify(saved_paths));
    });
    return [key, {path, set_path}];
  })));
  return (
    <section style="align-items: center">
      <div role="group" id="paths">
        <For each={Object.entries(paths())}>
          {([key, {path, set_path}]) => (
            <div>
              <input value={path()} oninput={event => set_path(event.target.value)}/>
              <button onclick={() => {
                const saved_paths = JSON.parse(window.localStorage.getItem("saved_paths") || "{}");
                delete saved_paths[key];
                window.localStorage.setItem("saved_paths", JSON.stringify(saved_paths));
                set_paths(current => Object.fromEntries(Object.entries(current).filter(([path_key, _]) => path_key !== key)));
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 7l16 0"/>
                  <path d="M10 11l0 6"/>
                  <path d="M14 11l0 6"/>
                  <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/>
                  <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/>
                </svg>
              </button>
            </div>
          )}
        </For>
      </div>
      <svg xmlns='http://www.w3.org/2000/svg' width='min(100%, 1000px)' height='min(100%, 1000px)' viewBox='0 0 16 16' fill='none' stroke-linecap='round' stroke-linejoin='round'>
        <g stroke-width={stroke()} stroke={color(hsl())}>
          <For each={Object.values(paths())}>
            {({path}) =>  <path d={path()}/>}
          </For>
        </g>
        <g stroke="#000">
          <Show when={box()}>
            <rect width="16" height="16" stroke-width="0.2"/>
          </Show>
          <Show when={grid()}>
            {[...Array(17).keys()].map(x_coordinate => [...Array(17).keys()].map(y_coordinate => (<>
              <rect x={x_coordinate} y={y_coordinate} width="1" height="1" stroke-width="0.05"/>
              {x_coordinate > 2 && y_coordinate > 2 && x_coordinate < 13 && y_coordinate < 13 && (<>
                <text x={x_coordinate + 0.1} y="0.5">{x_coordinate}</text>
                <text x={x_coordinate + 0.1} y="15.9">{x_coordinate}</text>
                <text x="0.1" y={y_coordinate + 0.5}>{y_coordinate}</text>
                <text text-anchor="end" x="15.9" y={y_coordinate + 0.5}>{y_coordinate}</text>
              </>)}
              <path d="M0,4 h16 m0,4 h-16 m0,4 h16" stroke-width="0.1"/>
              <path d="M4,0 v16 m4,0 v-16 m4,0 v16" stroke-width="0.1"/>
            </>)))}
          </Show>
        </g>
      </svg>
      <div role="group" id="controls">
        <button onclick={() => {
          const [path, set_path] = createSignal("");
          const key = Date.now();
          createEffect(() => {
            const saved_paths = JSON.parse(window.localStorage.getItem("saved_paths") || "{}");
            saved_paths[key] = path();
            window.localStorage.setItem("saved_paths", JSON.stringify(saved_paths));
          });
          set_paths(current => ({...current, [key]: {path, set_path}}));
        }}>New path</button>
        <label>
          Toggle grid
          <input type="checkbox" onchange={event => set_grid(event.target.checked)}/>
        </label>
        <label>
          Toggle box
          <input type="checkbox" onchange={event => set_box(event.target.checked)} checked/>
        </label>
        <label>
          Stroke
          <input type="number" value={stroke() || ""} oninput={event => set_stroke(+event.target.value || 0)}/>
        </label>
      </div>
    </section>
  );
};

const Picker = (props) => {
  const set_value = event => set_hsl(value => ({...value, [props.type]: Math.min(+event.target.value, props.max ?? 100)}));
  return (
    <div role="group">
      <label for={props.type}>{props.type.charAt(0).toUpperCase() + props.type.slice(1)}</label>
      <input id={`${props.type}_range`} type="range" min="0" max={props.max ?? 100} value={hsl()[props.type]} on:input={set_value} style={{"background-image": props.max ? full_gradient() : background_gradient(props.type)}} tabindex="-1"/>
      <input id={props.type} type="number" min="0" max={props.max ?? 100} value={hsl()[props.type]} on:input={set_value} maxlength="3"/>
    </div>
  );
};

const Display = (props) => {
  const kids = children(() => props.children);
  createEffect(() => kids().forEach(child => child.style.background = color(hsl())));
  return <article>{kids()}</article>;
};

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>HSL</Title>
        <Meta charset="utf-8"/>
        <Meta name="viewport" content="width=device-width, initial-scale=1"/>
        <Link rel="icon" href="favicon.svg"/>
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <main>
              <h1 style={{background: color(hsl())}}>HSL</h1>
              <section>
                <Picker type="hue" max={360}/>
                <Picker type="saturation"/>
                <Picker type="lightness"/>
                <Picker type="opacity"/>
              </section>
              <section>
                <Display>
                  <button style="color: black">Button</button>
                  <button style="color: white">Button</button>
                  <input placeholder="placeholder"/>
                  <input type="submit"/>
                </Display>
              </section>
              <Favicon/>
            </main>
          </ErrorBoundary>
        </Suspense>
        <Scripts/>
      </Body>
    </Html>
  );
}
