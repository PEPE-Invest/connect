/* @flow */
'use strict';

import { UiMessage } from '../../core/CoreMessage';
import * as UI from '../../constants/ui';
import DataManager from '../../data/DataManager';
import { container, showView, postMessage } from './common';
import type { RequestPermission } from 'flowtype/ui-message';

const getPermissionText = (permissionType: string, deviceName: string): string => {
    let text: string = '';

    switch (permissionType) {
        case 'read':
            text = `Read data from ${deviceName}`;
            break;
        case 'read-meta':
            text = `Read metadata to ${deviceName}`;
        case 'write':
            text = `Write data to ${deviceName}`;
            break;
        case 'write-meta':
            text = `Write metadata to ${deviceName}`;
        case 'custom-message':
            text = `Call custom message on ${deviceName}`;

    }
    return text;
};

const getPermissionTooltipText = (permissionType: string): string => {
    // TODO: Change returned text

    let text: string = '';

    switch (permissionType) {
        case 'read':
            text = 'Application needs permission to read data';
            break;
        case 'read-meta':
            text = 'Application needs permission to read metadata';
        case 'write':
            text = 'Application needs permission to write data';
            break;
        case 'write-meta':
            text = 'Application needs permission to read metadata';
        case 'custom-message':
            text = 'Custom message';
            break;
    }
    return text;
}

const createTooltip = (text: string): HTMLDivElement => {
    const infoIcon: HTMLDivElement = document.createElement('div');
    infoIcon.className = 'info-icon';

    const tooltip: HTMLDivElement = document.createElement('div');
    tooltip.className = 'tooltip';
    const tooltipText = document.createElement('span')
    tooltipText.appendChild(
        document.createTextNode(text)
    );
    tooltip.appendChild(tooltipText);

    infoIcon.appendChild(tooltip);
    return infoIcon;
};

export const initPermissionsView = (payload: $PropertyType<RequestPermission, 'payload'>): void => {
    showView('permissions');

    const h3: HTMLElement = container.getElementsByTagName('h3')[0];
    const hostName: HTMLElement = h3.getElementsByTagName('span')[0];
    const permissionsList: HTMLElement = container.getElementsByClassName('permissions-list')[0];
    const confirmButton: HTMLElement = container.getElementsByClassName('confirm')[0];
    const cancelButton: HTMLElement = container.getElementsByClassName('cancel')[0];
    const rememberCheckbox: HTMLInputElement = (container.getElementsByClassName('remember-permissions')[0]: any);

    hostName.innerHTML = DataManager.getSettings('origin');
    if (payload && Array.isArray(payload.permissions)) {
        payload.permissions.forEach(p => {
            const listItem: HTMLLIElement = document.createElement('li');

            const tooltip = createTooltip(
                getPermissionTooltipText(p)
            );
            listItem.appendChild(tooltip);

            const permissionText = getPermissionText(p, payload.device.label);
            listItem.appendChild(
                document.createTextNode(permissionText)
            );

            permissionsList.appendChild(listItem);
        });
    }

    confirmButton.onclick = () => {
        postMessage(new UiMessage(UI.RECEIVE_PERMISSION, {
            remember: (rememberCheckbox && rememberCheckbox.checked),
            granted: true,
        }));
        showView('loader');
    };

    cancelButton.onclick = () => {
        postMessage(new UiMessage(UI.RECEIVE_PERMISSION, {
            remember: (rememberCheckbox && rememberCheckbox.checked),
            granted: false,
        }));
        showView('loader');
    };

    rememberCheckbox.onchange = (e) => {
        confirmButton.innerText = e.target.checked ? 'Remember permissions' : 'Allow once for this session';
    };
};
