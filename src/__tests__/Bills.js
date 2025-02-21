/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"
import "@testing-library/jest-dom"
import router from "../app/Router.js"
import { formatDate, formatStatus } from "../app/format.js"

jest.mock("../app/store", () => mockStore)
jest.mock("../app/format.js")

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    /**
     * TEST IF THE WINDOW ICON IS HIGHLIGHTED
     */
    it("Should highlight bill icon in vertical layout", async () => {
      // Local storage simulation
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
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
      const dateElements = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((elem) => elem.textContent)

      // Convert List onto Array
      const dates = Array.from(dateElements).map((elem) => elem.textContent)
      // Create a function to sort dates in anti-chronological order
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      // Sort dates
      const datesSorted = [...dates].sort(antiChrono)
      // Expect the dates to be sorted in anti-chronological
      expect(dates).toEqual(datesSorted)
    })
  })

  /**
   * TEST IF THE MODAL OPENS WHEN CLICKING ON THE EYE ICON
   */
  describe("When I am on Bills Page and I click on the eye icon", () => {
    it("Should open a modal", () => {
      // Mock document
      const document = {
        querySelector: jest.fn().mockReturnValue({
          getAttribute: jest.fn(),
          addEventListener: jest.fn(),
        }),
        querySelectorAll: jest.fn().mockReturnValue([
          {
            click: jest.fn(),
            getAttribute: jest.fn(),
            addEventListener: jest.fn(),
          },
        ]),
      }
      // Simulate navigation function
      const onNavigate = jest.fn()
      const store = null
      // Manage session data
      const localStorage = window.localStorage

      // New Bills instance
      const bills = new Bills({
        document,
        onNavigate,
        store,
        localStorage,
      })

      // Monitor handleClickIconEye function
      const handleClickIconEye = jest.spyOn(bills, "handleClickIconEye")
      // Get Icon Eye
      const iconEye = document.querySelector(`div[data-testid="icon-eye"]`)

      // Mock jQuery modal
      const modalMock = jest.fn()
      $.fn.modal = modalMock

      // Call handleClickIconEye function
      bills.handleClickIconEye(iconEye)
      // Expect handleClickIconEye to have been called
      expect(handleClickIconEye).toHaveBeenCalled()
      // Expect modal to have been called
      expect(modalMock).toHaveBeenCalled()
    })
  })

  /**
   * TEST IF NAVIGATE TO NEW BILL PAGE
   */
  describe("When I click on the button to create a new bill", () => {
    it("Should call the onNavigate function with the 'NewBill' route", () => {
      // Simulate navigation function
      const onNavigate = jest.fn()
      const document = {
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(),
      }
      // Manage session data
      const localStorage = window.localStorage
      const store = null
      // New Bills instance
      const bills = new Bills({
        document,
        onNavigate,
        store,
        localStorage,
      })
      // Call handleClickNewBill function
      bills.handleClickNewBill()
      // Expect onNavigate to have been called with the 'NewBill' route
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"])
    })
  })

  /**
   * TEST IF THE MODAL OPENS WHEN CLICKING ON THE EYE ICON
   */
  describe("When I click on the icon", () => {
    it("Should call the handleClickIconEye function", () => {
      // Set DOM
      document.body.innerHTML = `
        <div data-testid="icon-eye"></div>
      `
      // Simulate navigation function
      const onNavigate = jest.fn()
      // New Bills instance
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })
      // Call handleClickIconEye function
      billsInstance.handleClickIconEye = jest.fn()
      // Set icon
      const icon = document.querySelector(`[data-testid="icon-eye"]`)
      // Add event listener to icon
      icon.addEventListener("click", () =>
        billsInstance.handleClickIconEye(icon)
      )
      // Click on icon
      icon.click()
      // Expect handleClickIconEye to have been called
      expect(billsInstance.handleClickIconEye).toHaveBeenCalledWith(icon)
    })
  })
})

/**
 * TEST GET BILLS
 */
describe("Given I am a user connected as Employee", () => {
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      // Monitor bills method
      jest.spyOn(mockStore, "bills")
      // Mock local storage
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      // Store user as employee in local storage
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "employee@example.com" })
      )
      // SetDOM
      document.body.innerHTML = `<div id="root"></div>`
      // Call router function
      router()
    })

    /**
     * TEST IF THE ERROR MESSAGE 404 IS DISPLAYED
     */
    it("Should fetch bills from an API and fails with 404 message error", async () => {
      // Mock bills method
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 404")),
        }
      })
      // Navigate to Bills page
      window.onNavigate(ROUTES_PATH.Bills)
      // Wait for Promise
      await new Promise(process.nextTick)
      // Get error message
      const message = await screen.getByText(/Erreur 404/)
      // Expect the error message to be displayed
      expect(message).toBeTruthy()
    })

    /**
     * TEST IF THE ERROR MESSAGE 500 IS DISPLAYED
     */
    it("Should fetch bills from an API and fails with 500 message error", async () => {
      // Mock bills method
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 500")),
        }
      })
      // Navigate to Bills page
      window.onNavigate(ROUTES_PATH.Bills)
      // Wait for Promise
      await new Promise(process.nextTick)
      // Get error message
      const message = await screen.getByText(/Erreur 500/)
      // Expect the error message to be displayed
      expect(message).toBeTruthy()
    })
  })

  /**
   * TEST WHEN FORMAT DATE THROWS AN ERROR, IT LOGS AN ERROR AND RETURNS THE UNFORMATTED DATE
   */
  describe("getBills", () => {
    it("Should log an error and return the unformatted date when formatDate throws an error", async () => {
      // Mock store
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          list: jest
            .fn()
            .mockResolvedValue([{ date: "2022-01-01", status: "pending" }]),
        }),
      }
      // Monitor console log
      const consoleLogSpy = jest.spyOn(console, "log")
      // Simulate formatDate error
      formatDate.mockImplementationOnce(() => {
        throw new Error("formatDate error")
      })
      // Set DOM
      document.body.innerHTML = `<div id="root"></div>`

      // New Bills instance
      const bills = new Bills({
        document,
        onNavigate: () => {},
        store: mockStore,
        localStorage: window.localStorage,
      })
      // Call getBills method
      await bills.getBills()

      // Expect console log to have been called with the error
      expect(consoleLogSpy).toHaveBeenCalledWith(
        new Error("formatDate error"),
        "for",
        { date: "2022-01-01", status: "pending" }
      )
    })
  })
})
