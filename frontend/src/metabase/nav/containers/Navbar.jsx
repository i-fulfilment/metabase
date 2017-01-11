import React, { Component, PropTypes } from 'react';
import cx from "classnames";

import { connect } from "react-redux";
import { push } from "react-router-redux";
import { Link } from "react-router";

import Icon from "metabase/components/Icon.jsx";

import DashboardsDropdown from "metabase/nav/containers/DashboardsDropdown.jsx";
import ProfileLink from "metabase/nav/components/ProfileLink.jsx";

import { getPath, getContext, getUser } from "../selectors";

const mapStateToProps = (state, props) => ({
    path:       getPath(state, props),
    context:    getContext(state, props),
    user:       getUser(state)
});

const mapDispatchToProps = {
    onChangeLocation: push
};

const AdminNavItem = ({ name, path, currentPath }) =>
    <li>
        <Link
            to={path}
            data-metabase-event={"Navbar;" + name}
            className={cx("NavItem py1 px2 no-decoration", {"is--selected": currentPath.startsWith(path) })}
        >
            {name}
        </Link>
    </li>

@connect(mapStateToProps, mapDispatchToProps)
export default class Navbar extends Component {
    static propTypes = {
        className: PropTypes.string,
        context: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        user: PropTypes.object
    };

    constructor(props, context) {
        super(props, context);

        this.styles = {
            navButton: {
                paddingLeft: "1.0rem",
                paddingRight: "1.0rem",
                paddingTop: "0.75rem",
                paddingBottom: "0.75rem"
            },

            newQuestion: {
                paddingLeft: "1.0rem",
                paddingRight: "1.0rem",
                paddingTop: "0.75rem",
                paddingBottom: "0.75rem",
            }
        };
    }

    isActive(path) {
        return this.props.path.startsWith(path);
    }

    renderAdminNav() {
        return (
            <nav className={cx("Nav AdminNav", this.props.className)}>
                <div className="wrapper flex align-center">
                    <div className="NavTitle flex align-center">
                        <Icon name={'gear'} className="AdminGear" size={22}></Icon>
                        <span className="NavItem-text ml1 hide sm-show text-bold">Metabase Admin Panel</span>
                    </div>

                    <ul className="sm-ml4 flex flex-full text-strong">
                        <AdminNavItem name="Settings"    path="/admin/settings"     currentPath={this.props.path} />
                        <AdminNavItem name="People"      path="/admin/people"       currentPath={this.props.path} />
                        <AdminNavItem name="Data Model"  path="/admin/datamodel"    currentPath={this.props.path} />
                        <AdminNavItem name="Databases"   path="/admin/databases"    currentPath={this.props.path} />
                        <AdminNavItem name="Permissions" path="/admin/permissions"  currentPath={this.props.path} />
                    </ul>

                    <ProfileLink {...this.props} />
                </div>
            </nav>
        );
    }

    renderEmptyNav() {
        return (
            <nav className={cx("Nav py2 sm-py1 xl-py3 relative", this.props.className)}>
                <ul className="wrapper flex align-center">
                </ul>
            </nav>
        );
    }

    renderMainNav() {
        return (
            <nav className={cx("Nav CheckBg CheckBg-offset relative", this.props.className)}>
                <ul className="flex align-center">
                    <li className="pl3">
                        <DashboardsDropdown {...this.props}>
                            <a data-metabase-event={"Navbar;Dashboard Dropdown;Toggle"} style={this.styles.navButton} className={cx("NavDropdown-button NavItem cursor-pointer px2 flex align-center transition-background", {"NavItem--selected": this.isActive("/dash/")})}>
                                <span className="NavDropdown-button-layer">
                                    Reports
                                    <Icon className="ml1" name={'chevrondown'} size={8}></Icon>
                                </span>
                            </a>
                        </DashboardsDropdown>
                    </li>

                    <li className="pl3">
                        <Link to="/q" data-metabase-event={"Navbar;New Question"} style={this.styles.newQuestion} className="NavItem inline-block cursor-pointer px2 no-decoration transition-all"><span className="hide sm-show">Explore Your Data</span></Link>
                    </li>
                </ul>
            </nav>
        );
    }

    render() {
        let { context, user } = this.props;

        if (!user) return null;

        switch (context) {
            case "admin": return this.renderAdminNav();
            case "auth": return null;
            case "none": return this.renderEmptyNav();
            case "setup": return null;
            default: return this.renderMainNav();
        }
    }
}
