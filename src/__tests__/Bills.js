/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import userEvent from "@testing-library/user-event"
import mockStore from "../__mocks__/store.js"

import router from "../app/Router.js"

describe("Given I am connected as an employee and I am on Bill page", () => {
  /**
   * TEST IF THE WINDOW ICON IS HIGHLIGHTED
   */
  it("Should highlight bill icon in vertical layout", async () => {
    // Local storage simulation
    Object.defineProperty(window, "localStorage", { value: localStorageMock })
    // Store user as employee in local storage
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    )
    // Create root element
    const root = document.createElement("div")
    // Set root element id
    root.setAttribute("id", "root")
    // Append root element to body
    document.body.append(root)
    // Call router function
    router()
    // Navigate to Bills page
    window.onNavigate(ROUTES_PATH.Bills)
    // Wait for the page to be loaded
    await waitFor(() => screen.getByTestId("icon-window"))
    // Get window icon
    const windowIcon = screen.getByTestId("icon-window")
    // Expect the window icon to have class "active-icon"
    expect(windowIcon.classList.contains("active-icon")).toBeTruthy() // ADD EXPECT TO CHECK IF THE ICON IS HIGHLIGHTED
  })

  /**
   * TEST IF THE BILLS ARE SORTED FROM EARLIEST TO LATEST
   */
  it("Should sort bills from earliest to latest", () => {
    // Create user interface with bills data
    document.body.innerHTML = BillsUI({ data: bills })
    // Get all dates from the page
    const dates = screen
      .getAllByText(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
      )
      .map((a) => a.innerHTML)
    // Create a function to sort dates in anti-chronological order
    const antiChrono = (a, b) => (a < b ? 1 : -1)
    // Sort dates
    const datesSorted = [...dates].sort(antiChrono)
    // Expect the dates to be sorted in anti-chronological
    expect(dates).toEqual(datesSorted)
  })

  /**
   * TEST IF NAVIGATE TO NEW BILL PAGE
   */
  describe("When I click on 'nouvelle note de frais' button", () => {
    it("Should be sent on 'Envoyer une note de frais' page", () => {
      // Local storage simulation
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      // Store user as employee in local storage
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      )
      // Create user interface with bills data
      document.body.innerHTML = BillsUI({ bills })
      // Create onNavigate function
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      // Create store
      const store = null
      // Create Bills page
      const billspage = new Bills({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      })
      // Create mock function
      const handleClickNewBill = jest.fn(billspage.handleClickNewBill)
      // Select new bill button
      const newBillButton = screen.getByTestId("btn-new-bill")
      // Add event listener on new bill button
      newBillButton.addEventListener("click", handleClickNewBill)
      // Click on new bill button
      userEvent.click(newBillButton)
      // Expect the handleClickNewBill function to have been called
      expect(handleClickNewBill).toHaveBeenCalled()
      // Expect text "Envoyer une note de frais" to be present
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
  })

  /**
   * TEST IF THE MODAL OPENS WHEN CLICKING ON THE EYE ICON
   */
  describe("When I click on the icon eye", () => {
    // Mock jQuery modal function to avoid an error
    beforeAll(() => {
      jQuery.fn.modal = jest.fn()
    })

    it("Should open a modal", () => {
      // Local storage simulation
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      // Store user as employee in local storage
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
      // Create user interface with bills data
      document.body.innerHTML = BillsUI({ data: bills })
      // Create onNavigate function
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      // Create store
      const store = null
      // Create Bills page
      const billspage = new Bills({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      })
      // Get all eye icons
      const iconEye = screen.getAllByTestId("icon-eye")
      // Expect the eye icons to be present (at least 1)
      expect(iconEye.length).toBeGreaterThan(0)
      // Simulate click on the first eye icon
      const handleClickIconEye = jest.fn((icon) =>
        billspage.handleClickIconEye(icon)
      )
      // Add event listener on eye icons
      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => handleClickIconEye(icon))
      })
      // Click on the first eye icon
      userEvent.click(iconEye[0])
      // Expect the handleClickIconEye function to have been called
      expect(handleClickIconEye).toHaveBeenCalled()
      // Expect the handleClickIconEye function to have been called with the first eye icon
      expect(handleClickIconEye).toHaveBeenCalledWith(iconEye[0])
      // Expect the modal to have been called only once
      expect(handleClickIconEye).toHaveReturnedTimes(1)
      // Expect the modal to have been called
      expect(jQuery.fn.modal).toHaveBeenCalledWith("show")
    })
  })

  /**
   * TEST GET BILLS
   */
  it("Should fetch bills from mock API", async () => {
    // Store user as employee in local storage
    localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "a@a" })
    )
    // Create root element
    const root = document.createElement("div")
    // Set root element id
    root.setAttribute("id", "root")
    // Append root element to body
    document.body.append(root)
    // Call router function
    router()
    // Navigate to Bills page
    window.onNavigate(ROUTES_PATH.Bills)
    // Wait for the page to be loaded
    await waitFor(() => screen.getByText("Mes notes de frais"))
    // Set transports section
    const contentPending = screen.getByText("Transports")
    // Expect the transports section to be present
    expect(contentPending).toBeTruthy()
    // Set services secion
    const contentRefused = screen.getByText("Services en ligne")
    // Expect the services section to be present
    expect(contentRefused).toBeTruthy()
    // Expect the button "Nouvelle note de frais" to be present
    expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
  })
})
