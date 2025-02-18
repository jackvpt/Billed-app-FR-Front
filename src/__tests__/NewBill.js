/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import BillsUI from "../views/BillsUI.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store.js"
import { bills } from "../fixtures/bills.js"
import "@testing-library/jest-dom/extend-expect"
import { checkFileType } from "../containers/NewBill.js"

import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

/**
 * TEST IF THE WINDOW ICON IS HIGHLIGHTED
 */
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // TEST : ajout du test de l'icone newbill en surbrillance
    it("Should highlight bill icon in vertical layout", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      )

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)

      router()

      window.onNavigate(ROUTES_PATH.NewBill)

      await waitFor(() => screen.getByTestId("icon-mail"))
      const windowIcon = screen.getByTestId("icon-mail")

      expect(windowIcon).toHaveClass("active-icon")
    })
  })

  /**
   * TEST IF THE FORM IS SUBMITTED
   */
  describe("When I am on NewBill Page and I filled all required inputs and add a jpg", () => {
    it("Should open bills page", () => {
      jest.spyOn(mockStore, "bills")

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      )

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = NewBillUI({
        data: bills,
      })

      const store = null

      const newBillPage = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      })

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.resolve({
              fileUrl: "https://localhost:3456/images/test.jpg",
              key: "1234",
            })
          },
        }
      })

      jest.spyOn(newBillPage, "onNavigate")
      newBillPage.fileUrl = "https://my-url.com/image.jpg"
      newBillPage.fileName = "image.jpg"
      const fakeEvent = {
        preventDefault: jest.fn(),
        target: {
          querySelector: jest.fn().mockImplementation((selector) => {
            if (selector === `select[data-testid="expense-type"]`) {
              return { value: "Services en ligne" }
            }
            if (selector === `input[data-testid="amount"]`) {
              return { value: 14 }
            }
            if (selector === `input[data-testid="datepicker"]`) {
              return { value: "1989-05-26" }
            }
            if (selector === `input[data-testid="pct"]`) {
              return { value: 20 }
            }
            return { value: undefined }
          }),
        },
      }

      newBillPage.handleSubmit(fakeEvent)
      expect(newBillPage.onNavigate).toHaveBeenCalledWith("#employee/bills")
    })
  })

  /**
   * TEST IF THE FILE IS IN THE RIGHT FORMAT
   */
  describe("When I am on NewBill Page and I add a file with the wrong format", () => {
    it("Should return false", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" })
      expect(checkFileType(file)).toBe(false)
    })
  })  
  describe("When I am on NewBill Page and I add a file with the right format", () => {
    const fileTypes = [{
      type: "image/png",
      name: "test.png"
    }, {
      type: "image/jpg",
      name: "test.jpg"
    }, {
      type: "image/jpeg",
      name: "test.jpg"
    }]

    fileTypes.forEach((fileType) => {
      it(`Should return true for ${fileType.type}`, () => {
        const file = new File(["test"], fileType.name, { type: fileType.type })
        expect(checkFileType(file)).toBe(true)
      })
    })
  })

  /**
   * TEST IF THE FORM IS SUBMITTED CORRECTLY
   */

  /**
   * TEST POST
   */
})
