import React, {useEffect, useId, useRef, useState} from 'react';
import {StatusBadge} from '../ui.jsx';
import {CATALOG, CONNECTIONS} from '../launch-catalog.js';
import {CHECK_FIRST, NOT_IN_CHECK, ROLES, ROLE_LABELS, ROLE_SESSIONS, SIGN_IN_CHOICES, canCheck, changeDraft, commandPreview, draftProfile, levelChoices, listOf, listSource,
  modelChoices, parseEnv, profileName, profilesOf, roleDefaultsOf, saveErrors, withProfile} from '../agent-settings-model.js';

const TITLES = {new: 'New profile', edit: 'Edit profile', duplicate: 'Duplicate profile'};
const FOCUSABLE = 'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

// The profile editor (specifications/agent-orchestration.md, Workbench; Model and effort
// lists). Model and effort come only from the lists of the provider check or the
// documented list. `base` is the settings and digest that the edit starts from.
export default function ProfileEditor({mode, original, initial, base, providers, validity, checks, onCheck, onCancel, onSave}) {
  const [draft, setDraft] = useState(initial), [busy, setBusy] = useState(false);
  const id = useId(), dialog = useRef(null), name = useRef(null);
  const index = original && Array.isArray(base.settings?.profiles) ? base.settings.profiles.findIndex(p => p?.id === original) : -1;
  // An existing profile opens with the reasons that make it invalid now.
  const [errors, setErrors] = useState(() => ({title: 'This profile is not valid:', list: index >= 0 ? validity?.profiles[index]?.reasons || [] : []}));
  const refuse = list => setErrors({title: 'Plane cannot save this profile:', list});
  const provider = providers.find(p => p.harness === draft.harness), list = listOf(provider, draft.connection);
  const change = (field, value) => setDraft(current => changeDraft(current, field, value, providers));
  useEffect(() => {name.current?.focus();}, []);
  // A check that brings the first list selects its first model.
  useEffect(() => {if (!draft.model && list?.models.length) change('model', list.models[0].id);}, [list]);

  const keys = event => {
    if (event.key === 'Escape') {event.stopPropagation();if (!busy) onCancel();return;}
    if (event.key !== 'Tab') return;
    const items = [...dialog.current.querySelectorAll(FOCUSABLE)].filter(n => !n.disabled && n.offsetParent !== null), first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  };
  async function submit(event) {
    event.preventDefault();if (busy) return;
    const local = [];
    if (!draft.name.trim()) local.push('Enter a name.');
    if (!draft.model) local.push(list ? 'Select a model from the list.' : CHECK_FIRST);
    const env = parseEnv(draft.env);if (env.error) local.push(env.error);
    if (local.length) {refuse(local);return;}
    setBusy(true);refuse([]);
    const next = withProfile(base.settings, original, draftProfile(draft), draft.roles);
    const result = await onSave(next.settings, draft);
    setBusy(false);
    if (result.validity) refuse(saveErrors(result.validity, next.index));
    else if (result.error) refuse([result.error]);
  }

  const source = listSource(provider, draft.connection), check = checks[draft.harness];
  const models = modelChoices(list, draft.model), levels = levelChoices(list, draft.model, draft.reasoning);
  const missingModel = models.find(m => m.value === draft.model)?.missing;
  const defaults = roleDefaultsOf(base.settings), others = profilesOf(base.settings);
  const profile = draftProfile(draft), preview = commandPreview(profile, provider);
  const claudePlan = draft.harness === 'claude-code' && draft.signIn === 'plan';
  const levelHelp = {levels: `Levels that ${draft.model} offers.`, none: 'This model has no effort levels.', 'not-checked': 'The check did not read the levels of this model. It runs with its default level.',
    unknown: list ? 'The last check does not list this model.' : CHECK_FIRST}[levels.state];
  const connectionHelp = connection => {
    const program = provider?.programs[connection];
    const text = connection === 'acp' ? (claudePlan ? 'Needs an API key sign-in for Claude.' : 'Plane shows output, permission requests and the last message.') : 'You work with the agent in a herdr pane.';
    return program && !program.path ? `${text} ${program.name} is not on PATH.` : text;
  };

  return <div className="dialog-backdrop">
    <section className="dialog profile-editor" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} ref={dialog} onKeyDown={keys}>
      <form onSubmit={submit} noValidate>
        <h2 id={`${id}-title`} className="dialog-title">{TITLES[mode]}</h2>

        <div className="editor-row">
          <div className="field">
            <label htmlFor={`${id}-name`}>Name</label>
            <input id={`${id}-name`} ref={name} value={draft.name} onChange={event => change('name', event.target.value)} autoComplete="off" placeholder="For example Codex fast"/>
            <small>ID: <span className="mono">{profile.id}</span>{draft.id ? '' : '. Plane makes it from the name.'}</small>
          </div>
          <div className="field">
            <label htmlFor={`${id}-harness`}>Harness tool</label>
            <select id={`${id}-harness`} value={draft.harness} onChange={event => change('harness', event.target.value)}>
              {providers.map(p => <option key={p.harness} value={p.harness}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className="list-source" role="status" aria-label="Source of the lists">
          <StatusBadge status={source.status}>{source.badge}</StatusBadge>
          <p>{source.text}</p>
          {canCheck(provider) ? <button type="button" disabled={check?.busy} aria-busy={Boolean(check?.busy)} onClick={() => onCheck(draft.harness)}>{check?.busy ? 'Checking…' : provider.check ? 'Check again' : 'Check'}</button>
            : <small className="muted">{CATALOG[draft.harness].acp.program} is not on PATH.</small>}
          {check?.error && <p className="list-source-error" role="alert">{check.error}</p>}
        </div>

        <div className="editor-row">
          <div className="field half">
            <label htmlFor={`${id}-sign-in`}>Sign-in</label>
            <select id={`${id}-sign-in`} value={draft.signIn} onChange={event => change('signIn', event.target.value)}>
              {SIGN_IN_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <small>How the harness tool signs in. Plane cannot check it and never asks for a credential.</small>
          </div>
        </div>

        <fieldset className="editor-group">
          <legend>Connection</legend>
          <div className="choice-cards">
            {CONNECTIONS.map(connection => {
              const off = connection === 'acp' && claudePlan, on = draft.connection === connection;
              return <label key={connection} className={`choice-card${on ? ' selected' : ''}${off ? ' disabled' : ''}`}>
                <input type="radio" name={`${id}-connection`} value={connection} checked={on} disabled={off} onChange={() => change('connection', connection)}/>
                <span><b>{connection === 'acp' ? 'ACP' : 'Terminal'}</b><small>{connectionHelp(connection)}</small></span>
              </label>;
            })}
          </div>
        </fieldset>

        <div className="editor-row">
          <div className="field model-field">
            <label htmlFor={`${id}-model`}>Model</label>
            <select id={`${id}-model`} value={draft.model} disabled={!models.length} onChange={event => change('model', event.target.value)}>
              {models.length ? models.map(m => <option key={m.value} value={m.value}>{m.label}</option>) : <option value="">{CHECK_FIRST}</option>}
            </select>
            {missingModel ? <small className="settings-warning">{NOT_IN_CHECK}. The profile can still start.</small>
              : <small>{list ? `${list.models.length} ${list.models.length === 1 ? 'model' : 'models'} ${list.source === 'documented' ? 'in the documented list' : 'from the last check'}.` : CHECK_FIRST}</small>}
          </div>
          <div className="field">
            <label htmlFor={`${id}-effort`}>Effort</label>
            <select id={`${id}-effort`} value={draft.reasoning} disabled={levels.choices.length < 2} onChange={event => change('reasoning', event.target.value)}>
              {levels.choices.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            {levels.choices.find(l => l.value === draft.reasoning)?.missing ? <small className="settings-warning">{NOT_IN_CHECK}. The profile can still start.</small> : <small>{levelHelp}</small>}
          </div>
        </div>

        <fieldset className="editor-group">
          <legend>Default for</legend>
          <div className="role-checks">
            {ROLES.map(role => {
              const off = draft.connection === 'acp' && ROLE_SESSIONS.includes(role), now = defaults[role], replaces = now && now !== draft.id && others.find(p => p.id === now);
              return <label key={role} className={`check${off ? ' disabled' : ''}`}>
                <input type="checkbox" checked={draft.roles.includes(role)} disabled={off}
                  onChange={event => setDraft(current => ({...current, roles: event.target.checked ? [...current.roles, role] : current.roles.filter(r => r !== role)}))}/>
                <span>{ROLE_LABELS[role]}{replaces && draft.roles.includes(role) && <small className="muted"> · replaces {profileName(replaces)}</small>}</span>
              </label>;
            })}
          </div>
          {draft.connection === 'acp' && <small className="muted">Coordinator, product owner and technical lead need a terminal profile, because you chat with them in the harness tool.</small>}
        </fieldset>

        <div className="field">
          <span className="field-label" id={`${id}-run`}>Plane will run</span>
          {preview ? <pre className="command-preview" aria-labelledby={`${id}-run`}>{preview.join('\n')}</pre> : <p className="muted small">Select a model to see the command.</p>}
        </div>

        <details className="editor-advanced" open={Boolean(initial.args || initial.env)}>
          <summary>Advanced: extra arguments and environment variables</summary>
          <p className="muted small">Plane runs the harness program without a shell. It refuses options that skip permission prompts and variable names that look like credentials.</p>
          <div className="field">
            <label htmlFor={`${id}-args`}>Extra arguments, one on each line</label>
            <textarea id={`${id}-args`} rows={3} value={draft.args} spellCheck={false} onChange={event => change('args', event.target.value)} placeholder="--no-alt-screen"/>
            <small>Plane adds them after the catalog arguments.</small>
          </div>
          <div className="field">
            <label htmlFor={`${id}-env`}>Environment variables, one NAME=value on each line</label>
            <textarea id={`${id}-env`} rows={3} value={draft.env} spellCheck={false} onChange={event => change('env', event.target.value)} placeholder="HTTPS_PROXY=http://proxy.example:3128"/>
          </div>
        </details>

        {errors.list.length > 0 && <div className="operation-error" role="alert" aria-label="Validity errors">
          <p>{errors.title}</p>
          <ul>{errors.list.map(e => <li key={e}>{e}</li>)}</ul>
        </div>}

        <div className="editor-foot">
          <p className="muted small">Model and effort come only from these lists. Check the provider again when the harness tool adds a model.</p>
          <button type="button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="primary" disabled={busy} aria-busy={busy}>Save</button>
        </div>
      </form>
    </section>
  </div>;
}
