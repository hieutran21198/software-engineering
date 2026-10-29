import React, {useEffect, useRef, useState} from 'react';
import {PageHeader, Section, Notice, StatusBadge} from '../ui.jsx';
import {checkProvider, querySettings, saveSettings} from '../agent-settings-api.js';
import {ROLES, ROLE_LABELS, ROLE_SESSIONS, canCheck, commandText, connectionText, duplicateDraft, harnessLabel, levelText, modelSummary, modelText, newDraft, profileDraft,
  profileName, profileState, profilesOf, providerList, providerPrograms, relativeTime, roleChoices, roleDefaultsOf, signInState, withRoleDefault, withoutProfile} from '../agent-settings-model.js';
import ProfileEditor from './ProfileEditor.jsx';
import {useSessions} from '../Sessions.jsx';
import './SettingsPage.css';

const CONFLICT = 'The settings file changed after Plane read it. The page shows the current settings. Apply your change again.';
const checkError = error => error.status === 502 ? `${error.message} The last check result stays.` : error.message;
// One cell of a settings table. On a phone the cell shows its column name before the value.
const Cell = ({label, children, className, span}) => <td data-label={label} className={className} colSpan={span}><div className="cell">{children}</div></td>;

// The Agent settings page (specifications/agent-orchestration.md, Workbench): Providers,
// Role defaults and Profiles of the personal settings file, and the profile editor.
export default function SettingsPage() {
  const [view, setView] = useState({status: 'loading', data: null, error: null});
  const [checks, setChecks] = useState({}), [editor, setEditor] = useState(null), [notice, setNotice] = useState(null), [saving, setSaving] = useState(false);
  const dataRef = useRef(null), opener = useRef(null), sessions = useSessions();
  dataRef.current = view.data;

  async function load(signal) {
    try {const data = await querySettings(signal);setView({status: 'loaded', data, error: null});return data;}
    catch (error) {if (error.name !== 'AbortError') setView(current => ({...current, status: current.data ? 'loaded' : 'error', error: error.message}));return null;}
  }
  useEffect(() => {const controller = new AbortController();load(controller.signal);return () => controller.abort();}, []);

  async function check(harness) {
    setChecks(current => ({...current, [harness]: {busy: true, error: null}}));
    try {await checkProvider(harness);await load();setChecks(current => ({...current, [harness]: {busy: false, error: null}}));}
    catch (error) {setChecks(current => ({...current, [harness]: {busy: false, error: checkError(error)}}));}
  }
  async function checkAll() {for (const p of view.data.providers.filter(canCheck)) await check(p.harness);}

  // Saves the whole settings object with the digest that the change started from.
  async function save(settings, digest) {
    try {
      const result = await saveSettings(settings, digest);
      setView(current => ({...current, data: {...current.data, settings, digest: result.digest, validity: result.validity, error: null}}));
      // The session controls appear with the first profile (requirement AO18).
      sessions.refresh();
      return {ok: true};
    } catch (error) {
      if (error.status === 409) {await load();return error.body && 'settings' in error.body ? {conflict: true} : {error: error.message};}
      return {error: error.message, validity: error.status === 400 ? error.body?.validity : null};
    }
  }
  async function change(settings, done) {
    setSaving(true);setNotice(null);
    const result = await save(settings, view.data.digest);
    setSaving(false);
    setNotice(result.ok ? {text: done} : result.conflict ? {tone: 'warning', text: CONFLICT} : {tone: 'error', text: result.error});
  }

  function openEditor(mode, profile) {
    const data = view.data, ids = profilesOf(data.settings).map(p => p.id);
    opener.current = document.activeElement;setNotice(null);
    const draft = mode === 'new' ? newDraft(data.providers, ids) : mode === 'edit' ? profileDraft(profile, data.settings, ids) : duplicateDraft(profile, data.settings, ids);
    setEditor({mode, original: mode === 'edit' ? profile.id : null, draft, base: {settings: data.settings, digest: data.digest}, key: Date.now()});
  }
  function closeEditor() {
    setEditor(null);
    const target = opener.current;requestAnimationFrame(() => {if (target?.isConnected) target.focus();});
  }
  // A save from the editor. A conflict closes the editor; the notice offers the edit again on the current settings.
  async function saveEditor(settings, draft) {
    const result = await save(settings, editor.base.digest);
    if (result.ok) {closeEditor();setNotice({text: `Saved the profile ${draft.name.trim() || draft.id}.`});}
    else if (result.conflict) {
      const pending = editor;closeEditor();
      setNotice({tone: 'warning', text: 'The settings file changed after you opened the editor. The page shows the current settings. Apply your edit again.',
        action: () => {const data = dataRef.current, ids = profilesOf(data.settings).map(p => p.id);
          opener.current = document.activeElement;setNotice(null);
          setEditor({...pending, draft: {...draft, ids}, base: {settings: data.settings, digest: data.digest}, key: Date.now()});}});
    }
    return result;
  }
  function remove(profile) {
    const {settings, roles} = withoutProfile(view.data.settings, profile.id), name = profileName(profile);
    const roleText = roles.map(role => ROLE_LABELS[role]).join(', ');
    if (!window.confirm(`Delete the profile ${name}?${roles.length ? ` ${roleText} will have no default profile.` : ''}`)) return;
    change(settings, `Deleted the profile ${name}.`);
  }

  const data = view.data;
  return <section className="page wide settings-page" aria-label="Agent settings"><div className="column">
    <PageHeader title="Agent settings" subtitle={<>Personal settings in <code className="settings-path">{data?.path || 'profiles.json'}</code>, outside every repository. Plane stores no credential: each harness tool keeps its own sign-in and its own model providers.</>}/>
    {notice && <Notice tone={notice.tone} role={notice.tone === 'error' ? 'alert' : 'status'}
      action={<span className="form-actions">{notice.action && <button className="primary" onClick={notice.action}>Apply my edit again</button>}<button onClick={() => setNotice(null)}>Dismiss</button></span>}>{notice.text}</Notice>}
    {view.error && data && <Notice tone="error" action={<button onClick={() => load()}>Retry</button>}>{view.error}</Notice>}
    {view.status === 'loading' ? <p className="muted" role="status">Reading agent settings… Plane asks each harness program for its version.</p>
      : !data ? <Notice tone="error" action={<button onClick={() => {setView({status: 'loading', data: null, error: null});load();}}>Retry</button>}>{view.error}</Notice>
      : <SettingsSections data={data} checks={checks} saving={saving} onCheck={check} onCheckAll={checkAll} onEdit={openEditor} onRemove={remove}
        onRoleDefault={(role, id) => change(withRoleDefault(data.settings || {version: 1}, role, id), id ? `${ROLE_LABELS[role]} sessions now start with ${profileName(profilesOf(data.settings).find(p => p.id === id))}.` : `${ROLE_LABELS[role]} has no default profile.`)}/>}
    {editor && data && <ProfileEditor key={editor.key} mode={editor.mode} original={editor.original} initial={editor.draft} base={editor.base} providers={data.providers}
      validity={data.validity} checks={checks} onCheck={check} onCancel={closeEditor} onSave={saveEditor}/>}
  </div></section>;
}

function SettingsSections({data, checks, saving, onCheck, onCheckAll, onEdit, onRemove, onRoleDefault}) {
  // A refused or unreadable file is shown, never replaced.
  const locked = data.refused || Boolean(data.error);
  const profiles = profilesOf(data.settings), validity = data.validity;
  const fileErrors = validity?.errors || [];
  const anyChecking = Object.values(checks).some(c => c.busy);
  return <>
    {data.error && <Notice tone="error">{data.error} {data.refused ? 'Plane does not use or replace this file.' : 'Correct the file in an editor, then open this page again.'}</Notice>}
    {fileErrors.length > 0 && <Notice tone="error">The settings file has errors. Correct them before you save a change.<ul>{fileErrors.map(e => <li key={e}>{e}</li>)}</ul></Notice>}

    <Section title="Providers" summary="· harness tools on this computer" actions={<button onClick={onCheckAll} disabled={anyChecking || !data.providers.some(canCheck)} aria-busy={anyChecking}>Check all</button>}>
      <div className="settings-table-frame">
        <table className="settings-table providers-table">
          <thead><tr><th scope="col">Harness tool</th><th scope="col">Programs</th><th scope="col">Connections</th><th scope="col">Sign-in</th><th scope="col">Models</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
          <tbody>
            {data.providers.map(p => <ProviderRow key={p.harness} provider={p} check={checks[p.harness]} onCheck={onCheck}/>)}
            <ToolRow name="herdr" program={data.herdr} text={<>Hosts terminal sessions. {data.settings?.terminal?.open
              ? <>Open in terminal app runs <code>{commandText([...data.settings.terminal.open, 'herdr', 'session', 'attach'])} …</code></>
              : <>Open in terminal app needs <code>terminal.open</code> in the settings file, for example <code>["ghostty", "-e"]</code>.</>}</>}/>
            <ToolRow name="ttyd" program={data.ttyd} text="Shows terminal sessions inside the session page. Without ttyd, the page offers Open in terminal app only."/>
            <tr className="tool-row">
              <th scope="row">Session runner</th>
              <Cell label="State">{data.runner?.available ? <StatusBadge status="Passed">Available</StatusBadge> : <StatusBadge status="Unknown">Not available</StatusBadge>}</Cell>
              <Cell label="Use" className="tool-text" span={4}>{data.runner?.available ? 'Starts and follows sessions.' : 'Plane starts no session until the session runner is available.'}</Cell>
            </tr>
          </tbody>
        </table>
      </div>
      {data.providers.filter(p => checks[p.harness]?.error).map(p => <p key={p.harness} role="alert" className="operation-error settings-check-error">Check of {p.label}: {checks[p.harness].error}</p>)}
      <p className="tiny settings-note">Check starts the ACP agent in a private temporary folder, reads its sign-in state, models and reasoning levels, and stops it. Check sends no prompt.</p>
    </Section>

    <Section title="Default profile for each ADD role">
      <div className="role-defaults">
        {ROLES.map(role => <RoleDefault key={role} role={role} data={data} disabled={locked || saving || !profiles.length} onChange={onRoleDefault}/>)}
      </div>
      <p className="tiny settings-note">The launch dialog selects the default. You can choose another profile for each session. Coordinator, product owner and technical lead use terminal profiles, because you chat with them in the harness tool.</p>
    </Section>

    <Section title="Profiles" summary={`· ${profiles.length}`} actions={<button className="primary" disabled={locked || saving} onClick={() => onEdit('new')}>New profile</button>}>
      {profiles.length ? <div className="settings-table-frame">
        <table className="settings-table profiles-table">
          <thead><tr><th scope="col">Profile</th><th scope="col">Harness tool</th><th scope="col">Connection</th><th scope="col">Model</th><th scope="col">State</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{profiles.map(profile => {
            const index = data.settings.profiles.indexOf(profile), state = profileState(profile, validity?.profiles[index], data.providers.find(p => p.harness === profile.harness));
            const other = profile.harness === 'other', name = profileName(profile);
            return <tr key={index}>
              <th scope="row">{name}</th>
              <Cell label="Harness tool" className="nowrap">{harnessLabel(profile.harness)}</Cell>
              <Cell label="Connection" className="nowrap">{connectionText(profile)}</Cell>
              <Cell label="Model">{modelText(profile) || '—'}</Cell>
              <Cell label="State"><StatusBadge status={state.status}>{state.text}</StatusBadge>{state.detail && <small className="state-detail">{state.detail}</small>}</Cell>
              <Cell label="Actions" className="profile-actions">
                {other ? <small className="muted">Edit this profile in the settings file.</small> : <>
                  <button aria-label={`Edit ${name}`} disabled={locked || saving} onClick={() => onEdit('edit', profile)}>Edit</button>
                  <button aria-label={`Duplicate ${name}`} disabled={locked || saving} onClick={() => onEdit('duplicate', profile)}>Duplicate</button></>}
                <button className="danger" aria-label={`Delete ${name}`} disabled={locked || saving} onClick={() => onRemove(profile)}>Delete</button>
              </Cell>
            </tr>;
          })}</tbody>
        </table>
      </div> : <div className="empty-state settings-empty">
        <h2>No launch profile yet</h2>
        <p className="muted">Plane starts no agent session without a profile. Check a harness tool above, then create a profile from its models.</p>
      </div>}
    </Section>
  </>;
}

function ProviderRow({provider, check, onCheck}) {
  const programs = providerPrograms(provider), found = programs.filter(p => p.path), sign = signInState(provider), list = providerList(provider);
  const connections = provider.connections.filter(c => provider.programs[c]?.path);
  return <tr>
    <th scope="row">{provider.label}</th>
    <Cell label="Programs">{found.length ? programs.map(p => <div key={p.name} className={p.path ? 'mono' : 'muted small'}>{p.path ? `${p.name} ${p.version || '(version unknown)'}` : `${p.name} not found`}</div>)
      : <StatusBadge status="Unknown">Not found</StatusBadge>}</Cell>
    <Cell label="Connections">{connections.length ? <span className="connection-tags">{connections.map(c => <span key={c} className="connection-tag">{c === 'acp' ? 'ACP' : 'Terminal'}</span>)}</span> : '—'}</Cell>
    <Cell label="Sign-in">{sign ? <>
      <StatusBadge status={sign.status}>{sign.text}</StatusBadge>
      {sign.detail && <small className="state-detail">{sign.detail}</small>}
      {provider.check && <small className="state-detail">Checked {relativeTime(provider.check.checkedAt)}</small>}
      {provider.stale && <small className="settings-warning">The program changed since the last check. Check again.</small>}
    </> : provider.harness === 'claude-code' && provider.programs.terminal?.path ? <small className="muted">Plane does not check a plan sign-in.</small> : '—'}</Cell>
    <Cell label="Models">{list?.models.length ? <details className="model-list">
      <summary>{modelSummary(list)}</summary>
      <ul>{list.models.map(m => <li key={m.id}><span className="mono">{m.id}</span> <span className="muted">{levelText(m.levels)}</span></li>)}</ul>
      {list.source === 'documented' && <small className="muted">Documented list for the terminal program.</small>}
    </details> : <span className="muted">{provider.check?.state ? 'After sign-in' : canCheck(provider) ? 'Check to read them' : '—'}</span>}</Cell>
    <Cell label="Action" className="provider-action">{canCheck(provider) && <button aria-label={`Check ${provider.label}`} disabled={check?.busy} aria-busy={Boolean(check?.busy)} onClick={() => onCheck(provider.harness)}>{check?.busy ? 'Checking…' : 'Check'}</button>}</Cell>
  </tr>;
}

function ToolRow({name, program, text}) {
  return <tr className="tool-row">
    <th scope="row">{name}</th>
    <Cell label="Program">{program?.path ? <span className="mono">{name} {program.version || '(version unknown)'}</span> : <StatusBadge status="Unknown">Not found</StatusBadge>}</Cell>
    <Cell label="Use" className="tool-text" span={4}>{text}</Cell>
  </tr>;
}

function RoleDefault({role, data, disabled, onChange}) {
  const id = `role-default-${role}`, current = roleDefaultsOf(data.settings)[role] || '', state = data.validity?.roleDefaults?.[role];
  const choices = roleChoices(data.settings, data.validity, role);
  const none = choices.length ? 'No default' : !profilesOf(data.settings).length ? 'No profile yet' : ROLE_SESSIONS.includes(role) ? 'No terminal profile yet' : 'No valid profile yet';
  return <div className="role-default">
    <label htmlFor={id}>{ROLE_LABELS[role]}</label>
    <select id={id} value={current} disabled={disabled} onChange={event => onChange(role, event.target.value)}>
      <option value="">{none}</option>
      {choices.map(p => <option key={p.id} value={p.id}>{[profileName(p), modelText(p)].filter(Boolean).join(' · ')}</option>)}
      {current && !choices.some(p => p.id === current) && <option value={current}>{current} (no such profile)</option>}
    </select>
    {state && !state.valid && <small className="role-reason">{state.reason}</small>}
  </div>;
}
