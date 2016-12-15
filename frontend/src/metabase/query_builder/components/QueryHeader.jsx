import React, { Component, PropTypes } from "react";

import QueryModeButton from "./QueryModeButton.jsx";

import ActionButton from 'metabase/components/ActionButton.jsx';
import AddToDashSelectDashModal from 'metabase/components/AddToDashSelectDashModal.jsx';
import ButtonBar from "metabase/components/ButtonBar.jsx";
import DeleteQuestionModal from 'metabase/components/DeleteQuestionModal.jsx';
import HeaderBar from "metabase/components/HeaderBar.jsx";
import HistoryModal from "metabase/components/HistoryModal.jsx";
import Icon from "metabase/components/Icon.jsx";
import Modal from "metabase/components/Modal.jsx";
import ModalWithTrigger from "metabase/components/ModalWithTrigger.jsx";
import QuestionSavedModal from 'metabase/components/QuestionSavedModal.jsx';
import SaveQuestionModal from 'metabase/components/SaveQuestionModal.jsx';
import Tooltip from "metabase/components/Tooltip.jsx";

import { CardApi, RevisionApi } from "metabase/services";

import MetabaseAnalytics from "metabase/lib/analytics";
import Query from "metabase/lib/query";
import { cancelable } from "metabase/lib/promise";

import cx from "classnames";
import _ from "underscore";

export default class QueryHeader extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            recentlySaved: null,
            modal: null,
            revisions: null
        };

        _.bindAll(this, "resetStateOnTimeout",
            "onCreate", "onSave", "onBeginEditing", "onCancel", "onDelete",
            "onFollowBreadcrumb", "onToggleDataReference",
            "onFetchRevisions", "onRevertToRevision", "onRevertedRevision"
        );
    }

    static propTypes = {
        card: PropTypes.object.isRequired,
        originalCard: PropTypes.object,
        isEditing: PropTypes.bool.isRequired,
        tableMetadata: PropTypes.object, // can't be required, sometimes null
        onSetCardAttribute: PropTypes.func.isRequired,
        reloadCardFn: PropTypes.func.isRequired,
        setQueryModeFn: PropTypes.func.isRequired,
        isShowingDataReference: PropTypes.bool.isRequired,
        toggleDataReferenceFn: PropTypes.func.isRequired,
        isNew: PropTypes.bool.isRequired,
        isDirty: PropTypes.bool.isRequired
    }

    componentWillUnmount() {
        clearTimeout(this.timeout);
        if (this.requesetPromise) {
            this.requesetPromise.cancel();
        }
    }

    resetStateOnTimeout() {
        // clear any previously set timeouts then start a new one
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() =>
            this.setState({ recentlySaved: null })
        , 5000);
    }

    onCreate(card, addToDash) {
        // MBQL->NATIVE
        // if we are a native query with an MBQL query definition, remove the old MBQL stuff (happens when going from mbql -> native)
        // if (card.dataset_query.type === "native" && card.dataset_query.query) {
        //     delete card.dataset_query.query;
        // } else if (card.dataset_query.type === "query" && card.dataset_query.native) {
        //     delete card.dataset_query.native;
        // }

        if (card.dataset_query.query) {
            Query.cleanQuery(card.dataset_query.query);
        }

        // TODO: reduxify
        this.requesetPromise = cancelable(CardApi.create(card));
        return this.requesetPromise.then(newCard => {
            this.props.notifyCardCreatedFn(newCard);

            this.setState({
                recentlySaved: "created",
                modal: addToDash ? "add-to-dashboard" : "saved"
            }, this.resetStateOnTimeout);
        });
    }

    onSave(card, addToDash) {
        // MBQL->NATIVE
        // if we are a native query with an MBQL query definition, remove the old MBQL stuff (happens when going from mbql -> native)
        // if (card.dataset_query.type === "native" && card.dataset_query.query) {
        //     delete card.dataset_query.query;
        // } else if (card.dataset_query.type === "query" && card.dataset_query.native) {
        //     delete card.dataset_query.native;
        // }

        if (card.dataset_query.query) {
            Query.cleanQuery(card.dataset_query.query);
        }

        // TODO: reduxify
        this.requesetPromise = cancelable(CardApi.update(card));
        return this.requesetPromise.then(updatedCard => {
            if (this.props.fromUrl) {
                this.onGoBack();
                return;
            }

            this.props.notifyCardUpdatedFn(updatedCard);

            this.setState({
                recentlySaved: "updated",
                modal: addToDash ? "add-to-dashboard" : null
            }, this.resetStateOnTimeout);
        });
    }

    onBeginEditing() {
        this.props.onBeginEditing();
    }

    async onCancel() {
        if (this.props.fromUrl) {
            this.onGoBack();
        } else {
            this.props.onCancelEditing();
        }
    }

    async onDelete() {
        // TODO: reduxify
        await CardApi.delete({ 'cardId': this.props.card.id });
        this.onGoBack();
        MetabaseAnalytics.trackEvent("QueryBuilder", "Delete");
    }

    onFollowBreadcrumb() {
        this.props.onRestoreOriginalQuery();
    }

    onToggleDataReference() {
        this.props.toggleDataReferenceFn();
    }

    onGoBack() {
        this.props.onChangeLocation(this.props.fromUrl || "/");
    }

    async onFetchRevisions({ entity, id }) {
        // TODO: reduxify
        var revisions = await RevisionApi.list({ entity, id });
        this.setState({ revisions });
    }

    onRevertToRevision({ entity, id, revision_id }) {
        // TODO: reduxify
        return RevisionApi.revert({ entity, id, revision_id });
    }

    onRevertedRevision() {
        this.props.reloadCardFn();
        this.refs.cardHistory.toggle();
    }

    getHeaderButtons() {
        const { card ,isNew, isDirty, isEditing, tableMetadata, databases } = this.props;
        const database = _.findWhere(databases, { id: card && card.dataset_query && card.dataset_query.database });

        var buttonSections = [];

  

        // parameters
        if (Query.isNative(this.props.query) && database && _.contains(database.features, "native-parameters")) {
            const parametersButtonClasses = cx('transition-color', {
                'text-brand': this.props.uiControls.isShowingTemplateTagsEditor,
                'text-brand-hover': !this.props.uiControls.isShowingTemplateTagsEditor
            });
            buttonSections.push([
                <Tooltip key="parameterEdititor" tooltip="Variables">
                    <a className={parametersButtonClasses}>
                        <Icon name="variable" size={16} onClick={this.props.toggleTemplateTagsEditor}></Icon>
                    </a>
                </Tooltip>
            ]);
        }




        // data reference button
        var dataReferenceButtonClasses = cx('mr1 transition-color', {
            'text-brand': this.props.isShowingDataReference,
            'text-brand-hover': !this.state.isShowingDataReference
        });
        buttonSections.push([
            <Tooltip key="dataReference" tooltip="Learn about your data">
                <a className={dataReferenceButtonClasses}>
                    <Icon name='reference' size={16} onClick={this.onToggleDataReference}></Icon>
                </a>
            </Tooltip>
        ]);

        return (
            <ButtonBar buttons={buttonSections} className="Header-buttonSection borderless" />
        );
    }

    onCloseModal = () => {
        this.setState({ modal: null });
    }

    render() {
        return (
            <div>
                <HeaderBar
                    isEditing={this.props.isEditing}
                    name={this.props.isNew ? "Explore Your Data" : this.props.card.name}
                    description={this.props.card ? this.props.card.description : null}
                    breadcrumb={(!this.props.card.id && this.props.originalCard) ? (<span className="pl2">started from <a className="link" onClick={this.onFollowBreadcrumb}>{this.props.originalCard.name}</a></span>) : null }
                    buttons={this.getHeaderButtons()}
                    setItemAttributeFn={this.props.onSetCardAttribute}
                />

                <Modal className="Modal Modal--small" isOpen={this.state.modal === "saved"} onClose={this.onCloseModal}>
                    <QuestionSavedModal
                        addToDashboardFn={() => this.setState({ modal: "add-to-dashboard" })}
                        closeFn={this.onCloseModal}
                    />
                </Modal>

                <Modal isOpen={this.state.modal === "add-to-dashboard"} onClose={this.onCloseModal}>
                    <AddToDashSelectDashModal
                        card={this.props.card}
                        closeFn={this.onCloseModal}
                        onChangeLocation={this.props.onChangeLocation}
                    />
                </Modal>
            </div>
        );
    }
}
